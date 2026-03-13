const express = require("express");
const { createServer } = require("http");
const { createHandler } = require("graphql-http/lib/use/express");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { PubSub } = require("graphql-subscriptions");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("node:path");

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : path.join(__dirname, "serviceAccount.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});

const pubsub = new PubSub();

const typeDefs = `
  type User {
    uid: ID!
    email: String
    displayName: String
    wins: Int
    prefcol: String
  }

  type Lobby {
    id: ID!
    host: String!
    players: [User!]!
  }


  type Message {
    id: ID!
    text: String!
    sender: String!
    lobbyId: String!
  }

  type Query {
    user(uid: ID!): User
    users: [User!]!
    userByEmail(email: String!): User
    lobby(id: ID!): Lobby
    lobbies: [Lobby!]!
    getMessages(lobbyId: ID!): [Message!]!
  }

  type Mutation {
    updateDisplayNameByEmail(email: String!, displayName: String!): User
    updatePrefColorByEmail(email: String!, prefcol: String!): User
    createLobby(hostEmail: String!): Lobby
    joinLobby(lobbyId: ID!, playerEmail: String!): Lobby
    sendMessage(lobbyId: ID!, text: String!, sender: String!): Message
  }

  type Subscription {
    messageAdded(lobbyId: ID!): Message!
    lobbyUpdated(lobbyId: ID!): Lobby!
  }
`;

const db = admin.firestore();
const realtimeDb = admin.database();

const lobbies = {};
const users = {};

realtimeDb.ref("messages").on("child_added", (snapshot) => {
    const message = snapshot.val();

    pubsub.publish("MESSAGE_ADDED_" + message.lobbyId, {
        messageAdded: {
            id: snapshot.key,
            text: message.text ?? "",
            sender: message.sender ?? "",
            lobbyId: message.lobbyId ?? ""
        }
    });
});

const resolvers = {
    Query: {
        user: async (_, { uid }) => {
            const doc = await db.collection("users").doc(uid).get();
            if (!doc.exists) return null;
            return doc.data();
        },
        users: async () => {
            const snap = await db.collection("users").get();
            return snap.docs.map((d) => d.data());
        },
        userByEmail: async (_, { email }) => {
            const snap = await db.collection("users").where("email", "==", email).limit(1).get();
            if (snap.empty) return null;
            return snap.docs[0].data();
        },
        lobby: async (_, { id }) => {
            if (lobbies[id]) return lobbies[id];

            const doc = await db.collection("lobbies").doc(id).get();
            if (!doc.exists) return null;

            const lobby = doc.data();
            lobbies[id] = lobby;
            return lobby;
        },
        lobbies: async () => {
            const snap = await db.collection("lobbies").get();
            const allLobbies = snap.docs.map((d) => d.data());

            allLobbies.forEach((lobby) => {
                if (lobby?.id) {
                    lobbies[lobby.id] = lobby;
                }
            });

            return allLobbies;
        },
        getMessages: async (_, { lobbyId }) => {
            const snap = await realtimeDb.ref("messages").orderByChild("lobbyId").equalTo(lobbyId).get();
            if (!snap.val()) return [];
            return Object.entries(snap.val()).map(([key, val]) => ({ ...val, id: key }));
        }
    },
    Mutation: {
        updateDisplayNameByEmail: async (_, { email, displayName }) => {
            const snap = await db.collection("users").where("email", "==", email).limit(1).get();
            if (snap.empty) return null;
            const ref = snap.docs[0].ref;
            await ref.update({ displayName });
            return (await ref.get()).data();
        },
        updatePrefColorByEmail: async (_, { email, prefcol }) => {
            const snap = await db.collection("users").where("email", "==", email).limit(1).get();
            if (snap.empty) return null;
            const ref = snap.docs[0].ref;
            await ref.update({ prefcol });
            return (await ref.get()).data();
        },
        createLobby: async (_, { hostEmail }) => {
            const id = Math.random().toString(36).substring(2, 6).toUpperCase();
            const lobby = { id, host: hostEmail, players: [hostEmail] };

            lobbies[id] = lobby;
            await db.collection("lobbies").doc(id).set(lobby);

            pubsub.publish("LOBBY_UPDATED_" + id, { lobbyUpdated: lobby });
            return lobby;
        },
        joinLobby: async (_, { lobbyId, playerEmail }) => {
            let lobby = lobbies[lobbyId];
            if (!lobby) {
                const doc = await db.collection("lobbies").doc(lobbyId).get();
                if (!doc.exists) throw new Error("Lobby not found");
                lobby = doc.data();
                lobbies[lobbyId] = lobby;
            }

            lobby.players.push(playerEmail);
            await db.collection("lobbies").doc(lobbyId).update({ players: lobby.players });

            pubsub.publish("LOBBY_UPDATED_" + lobbyId, { lobbyUpdated: lobby });
            return lobby;
        },
        sendMessage: async (_, { lobbyId, text, sender }) => {
            const ref = realtimeDb.ref("messages").push();

            const message = {
                id: ref.key,
                lobbyId,
                text,
                sender,
                createdAt: Date.now()
            };

            await ref.set(message);

            pubsub.publish(`MESSAGE_ADDED_${lobbyId}`, { messageAdded: message });

            return message;
        }
    },
    Lobby: {
        players: async (lobby) => {
            const snaps = await Promise.all(
                lobby.players.map(email =>
                    db.collection("users").where("email", "==", email).limit(1).get()
                )
            );
            return snaps
                .filter(snap => !snap.empty)
                .map(snap => snap.docs[0].data());
        }
    },
    Subscription: {
        messageAdded: {
            subscribe: (_, { lobbyId }) => pubsub.asyncIterator([`MESSAGE_ADDED_${lobbyId}`]),
        },
        lobbyUpdated: {
            subscribe: (_, { lobbyId }) => pubsub.asyncIterator([`LOBBY_UPDATED_${lobbyId}`]),
        },
    },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
app.use(cors());
app.all("/graphql", createHandler({ schema }));

const httpServer = createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

useServer(
    {
        schema,
        onConnect: () => console.log("WebSocket client connected"),
        onDisconnect: () => console.log("WebSocket client disconnected"),
    },
    wsServer
);

httpServer.listen(4000, () => console.log("Server running on port 4000"));