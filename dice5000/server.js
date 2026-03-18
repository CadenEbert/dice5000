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

  type diceState {
    diceDisabled: [Boolean!]!
    diceSelected: [Boolean!]!
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

    type GameState {
    lobbyId: String!
    dice: [Int!]!
    scores: [Int!]!
    players: [User!]!
    currentPlayer: User!
    lastTurn: Boolean!
    }   

  type Mutation {
    updateDisplayNameByEmail(email: String!, displayName: String!): User
    updatePrefColorByEmail(email: String!, prefcol: String!): User
    createLobby(hostEmail: String!): Lobby
    joinLobby(lobbyId: ID!, playerEmail: String!): Lobby
    sendMessage(lobbyId: ID!, text: String!, sender: String!): Message
    startGame(lobbyId: ID!): GameState
    rollDice(lobbyId: ID!, playerEmail: String!, diceToRoll: [Int!]!, diceSelected: [Boolean!]!): GameState
    bankTurn(lobbyId: ID!, playerEmail: String!, currentTurnScore: Int!): GameState

  }

  type Subscription {
    messageAdded(lobbyId: ID!): Message!
    lobbyUpdated(lobbyId: ID!): Lobby!
    gameStateUpdated(lobbyId: ID!): GameState!
    diceStateUpdated(lobbyId: ID!): diceState!
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



async function getLobbyUsersByEmails(emails) {
    const snaps = await Promise.all(
        emails.map((email) =>
            db.collection("users").where("email", "==", email).limit(1).get()
        )
    );
    return snaps.filter((s) => !s.empty).map((s) => s.docs[0].data());
}

function toGraphQLGameState(state) {
    return {
        lobbyId: state.lobbyId,
        dice: state.dice,
        scores: state.scores,
        players: state.players,
        currentPlayer: state.currentPlayer,
        lastTurn: state.lastTurn,
    };
}

function publishGameStateSnapshot(snapshot) {
    const lobbyId = snapshot.key;
    const state = snapshot.val();
    if (!lobbyId || !state) return;
    pubsub.publish("GAMESTATE_UPDATED_" + lobbyId, {
        gameStateUpdated: toGraphQLGameState(state),
    });
}

function publishDiceStateSnapshot(snapshot) {
    const lobbyId = snapshot.key;
    const state = snapshot.val();
    if (!lobbyId || !state) return;

    pubsub.publish("DICESTATE_UPDATED_" + lobbyId, {
        diceStateUpdated: {
            diceDisabled: state.diceDisabled ?? [false, false, false, false, false, false],
            diceSelected: state.diceSelected ?? [false, false, false, false, false, false],
        },
    });
}


realtimeDb.ref("gameState").on("child_added", publishGameStateSnapshot);
realtimeDb.ref("gameState").on("child_changed", publishGameStateSnapshot);
realtimeDb.ref("diceState").on("child_added", publishDiceStateSnapshot);
realtimeDb.ref("diceState").on("child_changed", publishDiceStateSnapshot);

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
                createdAt: Date.now(),
            };

            await ref.set(message);
            return message;
        },
        startGame: async (_, { lobbyId }) => {
            const lobbyDoc = await db.collection("lobbies").doc(lobbyId).get();
            if (!lobbyDoc.exists) throw new Error("Lobby not found");
            const lobby = lobbyDoc.data();
            const players = await getLobbyUsersByEmails(lobby.players);

            if (!players.length) throw new Error("No players in lobby");

            const initialDiceState = {
                diceDisabled: [false, false, false, false, false, false],
                diceSelected: [false, false, false, false, false, false],
            }

            const gameState = {
                lobbyId,
                dice: [1, 1, 1, 1, 1, 1],
                scores: Array(players.length).fill(0),
                players,
                currentPlayerIndex: 0,
                currentPlayer: players[0],
                lastTurn: false,
                currentTurnScore: 0,
            };


            await realtimeDb.ref("gameState").child(lobbyId).set(gameState);
            await realtimeDb.ref("diceState").child(lobbyId).set(initialDiceState);

            return toGraphQLGameState(gameState);
        },
        rollDice: async (_, { lobbyId, playerEmail, diceToRoll, diceSelected }) => {
            const snap = await realtimeDb.ref("gameState").child(lobbyId).get();
            if (!snap.exists()) throw new Error("Game state not found");
            const state = snap.val();

            if (state.currentPlayer?.email !== playerEmail) {
                throw new Error("Not your turn");
            }

            for (const index of diceToRoll) {
                if (index < 0 || index > 5) continue;
                state.dice[index] = Math.floor(Math.random() * 6) + 1;
            }

            const nextDiceState = {
                diceDisabled: [0, 1, 2, 3, 4, 5].map((i) => !diceToRoll.includes(i)),
                diceSelected: Array.isArray(diceSelected) && diceSelected.length === 6
                    ? diceSelected
                    : [false, false, false, false, false, false],
            };

            await realtimeDb.ref("gameState").child(lobbyId).set(state);
            await realtimeDb.ref("diceState").child(lobbyId).set(nextDiceState);

            return toGraphQLGameState(state);
        },
        bankTurn: async (_, { lobbyId, playerEmail, currentTurnScore }) => {
            const snap = await realtimeDb.ref("gameState").child(lobbyId).get();
            if (!snap.exists()) throw new Error("Game state not found");
            const state = snap.val();

            if (state.currentPlayer?.email !== playerEmail) {
                throw new Error("Not your turn");
            }

            const i = state.currentPlayerIndex;
            state.scores[i] = (state.scores[i] || 0) + currentTurnScore;

            const next = (i + 1) % state.players.length;
            state.currentPlayerIndex = next;
            state.currentPlayer = state.players[next];
            state.currentTurnScore = 0;
            state.dice = [1, 1, 1, 1, 1, 1];

            await realtimeDb.ref("gameState").child(lobbyId).set(state);
            await realtimeDb.ref("diceState").child(lobbyId).set({
                diceDisabled: [false, false, false, false, false, false],
                diceSelected: [false, false, false, false, false, false],
            });

            
            return toGraphQLGameState(state);
        },


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
            subscribe: (_, { lobbyId }) => pubsub.asyncIterableIterator(["MESSAGE_ADDED_" + lobbyId]),
        },
        lobbyUpdated: {
            subscribe: (_, { lobbyId }) => pubsub.asyncIterableIterator(["LOBBY_UPDATED_" + lobbyId]),
        },
        gameStateUpdated: {
            subscribe: (_, { lobbyId }) => pubsub.asyncIterableIterator(["GAMESTATE_UPDATED_" + lobbyId]),
        },
        diceStateUpdated: {
            subscribe: (_, { lobbyId }) => pubsub.asyncIterableIterator(["DICESTATE_UPDATED_" + lobbyId]),
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