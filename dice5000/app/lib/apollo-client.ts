'use client';
import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { createClient } from "graphql-ws";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createHttpLink } from "@apollo/client";
import { create } from "domain";
import { getMainDefinition } from "@apollo/client/utilities/internal/internal.cjs";

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});


const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    reconnect: true,
  },
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});


export default client;