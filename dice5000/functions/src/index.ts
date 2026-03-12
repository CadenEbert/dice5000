import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { createYoga, createSchema } from "graphql-yoga";

admin.initializeApp();
const db = admin.firestore();

const typeDefs = `
  type User {
    uid: ID!
    email: String
    displayName: String
    wins: Int
    prefcol: String
  }

  type Query {
    user(uid: ID!): User
    users: [User!]!
    userByEmail(email: String!): User
  }

  type Mutation {
    updateDisplayNameByEmail(email: String!, displayName: String!): User
    updatePrefColorByEmail(email: String!, prefcol: String!): User
  }
`;

const resolvers = {
  Query: {
    user: async (_: unknown, args: { uid: string }) => {
      const doc = await db.collection("users").doc(args.uid).get();
      if (!doc.exists) return null;
      return doc.data();
    },
    users: async () => {
      const snap = await db.collection("users").get();
      return snap.docs.map((d) => d.data());
    },
    userByEmail: async (_: unknown, args: { email: string }) => {
      const snap = await db
        .collection("users")
        .where("email", "==", args.email)
        .limit(1)
        .get();

      if (snap.empty) return null;
      return snap.docs[0].data();
    },
  },

  Mutation: {
    updateDisplayNameByEmail: async (
      _: unknown,
      args: { email: string; displayName: string }
    ) => {
      const snap = await db
        .collection("users")
        .where("email", "==", args.email)
        .limit(1)
        .get();

      if (snap.empty) return null;

      const ref = snap.docs[0].ref;
      await ref.update({ displayName: args.displayName });
      const updatedDoc = await ref.get();
      return updatedDoc.data();
    },

    updatePrefColorByEmail: async (
      _: unknown,
      args: { email: string; prefcol: string }
    ) => {
      const snap = await db
        .collection("users")
        .where("email", "==", args.email)
        .limit(1)
        .get();

      if (snap.empty) return null;

      const ref = snap.docs[0].ref;
      await ref.update({ prefcol: args.prefcol });
      const updatedDoc = await ref.get();
      return updatedDoc.data();
    },
  },
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/",
});

export const graphqlApi = functions.https.onRequest((req, res) => {
  return yoga(req, res);
});

export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  await db.collection("users").doc(user.uid).set({
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    wins: 0,
    uid: user.uid,
    prefcol: "Blue",
  });
});