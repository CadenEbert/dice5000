const express = require("express");
const { createServer } = require("http");
const { createHandler } = require("graphql-http/lib/use/express");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { PubSub } = require("graphql-subscriptions");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

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
    players: [String!]!
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
        createLobby: (_, { hostEmail }) => {
            const id = Math.random().toString(36).substring(2, 6).toUpperCase();

            const lobby = {
                id,
                host: hostEmail,
                players: [hostEmail],
            };

            lobbies[id] = lobby;

            pubsub.publish("LOBBY_UPDATED_" + id, {
                lobbyUpdated: lobby,
            });

            return lobby;
        },
        joinLobby: (_, { lobbyId, playerEmail }) => {
            const lobby = lobbies[lobbyId];

            if (!lobby) {
                throw new Error("Lobby not found");
            }

            lobby.players.push(playerEmail);

            pubsub.publish("LOBBY_UPDATED_" + lobbyId, {
                lobbyUpdated: lobby,
            });

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