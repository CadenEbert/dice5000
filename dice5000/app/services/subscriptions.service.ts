import { createClient } from "graphql-ws";
import {
  Message,
  MessageAddedSub,
  GameState,
  GameStateUpdatedSub,
} from "@/app/services/types";

const wsClient = createClient({
  url: "ws://192.168.0.180:4000/graphql",
});

export function subscribeToMessages(
  lobbyCode: string,
  onMessage: (msg: Message) => void
): () => void {
  const unsubscribe = wsClient.subscribe(
    {
      query: `
        subscription ($lobbyId: ID!) {
          messageAdded(lobbyId: $lobbyId) {
            id
            text
            sender
          }
        }
      `,
      variables: { lobbyId: lobbyCode },
    },
    {
      next: (result) => {
        if (result.errors?.length) {
          console.error(JSON.stringify(result.errors, null, 2));
          return;
        }

        const data = result.data as MessageAddedSub | undefined;
        const msg = data?.messageAdded;
        if (!msg) return;

        onMessage(msg);
      },
      error: console.error,
      complete: () => {},
    }
  );

  return () => unsubscribe();
}

export function listenToGameState(
  lobbyCode: string,
  onStateChange: (state: GameState) => void
): () => void {
  const unsubscribe = wsClient.subscribe(
    {
      query: `
        subscription ($lobbyId: ID!) {
          gameStateUpdated(lobbyId: $lobbyId) {
            dice
            scores
            players {
              uid
              email
              displayName
              wins
              prefcol
            }
            currentPlayer {
              uid
              email
              displayName
              wins
              prefcol
            }
            lastTurn
            currentTurnScore
          }
        }
      `,
      variables: { lobbyId: lobbyCode },
    },
    {
      next: (result) => {
        if (result.errors?.length) {
          console.error(JSON.stringify(result.errors, null, 2));
          return;
        }

        const data = result.data as GameStateUpdatedSub | undefined;
        const state = data?.gameStateUpdated;
        if (!state) return;

        onStateChange(state);
      },
      error: console.error,
      complete: () => {},
    }
  );

  return () => unsubscribe();
}

export function listenToDiceState(
  lobbyCode: string,
  onStateChange: (diceDisabled: boolean[], diceSelected: boolean[]) => void
): () => void {
  const unsubscribe = wsClient.subscribe(
    {
      query: `
      subscription ($lobbyId: ID!) {
      diceStateUpdated(lobbyId: $lobbyId) {
        diceDisabled
        diceSelected
      }
    }
      `,
      variables: { lobbyId: lobbyCode },
    },
    {
      next: (result) => {
        if (result.errors?.length) {
          console.error(JSON.stringify(result.errors, null, 2));
          return;
        }
        const data = result.data as { diceStateUpdated: { diceDisabled: boolean[]; diceSelected: boolean[] } } | undefined;
        const diceState = data?.diceStateUpdated;
        if (!diceState) return;

        onStateChange(diceState.diceDisabled, diceState.diceSelected);
      },
      error: console.error,
      complete: () => {},
    }
  );

  return () => unsubscribe();
}