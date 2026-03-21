import { GameState, Message, User } from "@/app/services/types";

const graphqlUrl = "http://192.168.1.143:4000/graphql";

type GraphQLError = {
    message: string;
};

type GraphQLResponse<TData> = {
    data?: TData;
    errors?: GraphQLError[];
};

export type Lobby = {
    id: string;
    host: string;
    players: User[];
};

type GetUserByEmailData = {
    userByEmail: User | null;
};

type GetLobbyData = {
    lobby: Lobby | null;
};

type SendMessageData = {
    sendMessage: Message;
};

type RollDiceData = {
  rollDice: {
    lobbyId: string;
    dice: number[];

  };
};

type BankTurnData = {
  bankTurn: GameState;
};

const userByEmailQuery = `
  query GetUserByEmail($email: String!) {
    userByEmail(email: $email) {
      uid
      email
      displayName
      wins
      prefcol
    }
  }
`;

const lobbyQuery = `
  query GetLobby($id: ID!) {
    lobby(id: $id) {
      id
      host
      players {
        uid
        email
        displayName
        prefcol
        wins
      }
    }
  }
`;

const sendMessageMutation = `
  mutation SendMessage($lobbyId: ID!, $text: String!, $sender: String!) {
    sendMessage(lobbyId: $lobbyId, text: $text, sender: $sender) {
      id
      text
      sender
    }
  }
`;

const rollDiceMutation = `
  mutation RollDice($lobbyId: ID!, $playerEmail: String!, $diceToRoll: [Int!]!, $diceSelected: [Boolean!]!) {
    rollDice(lobbyId: $lobbyId, playerEmail: $playerEmail, diceToRoll: $diceToRoll, diceSelected: $diceSelected) {
      lobbyId
      dice
    }
  }
`;


const bankTurnMutation = `
    mutation bankTurn($lobbyId: ID!, $playerEmail: String!, $currentTurnScore: Int!) {
      bankTurn(lobbyId: $lobbyId, playerEmail: $playerEmail, currentTurnScore: $currentTurnScore) {
        lobbyId
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
  `;

async function graphqlRequest<TData, TVariables>(query: string, variables: TVariables): Promise<TData> {
    const res = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    const json = (await res.json()) as GraphQLResponse<TData>;

    if (json.errors?.length) {
        throw new Error(json.errors.map((error) => error.message).join(", "));
    }

    if (!json.data) {
        throw new Error("No GraphQL data returned");
    }

    return json.data;
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
    const data = await graphqlRequest<GetUserByEmailData, { email: string }>(userByEmailQuery, { email });
    return data.userByEmail;
}

export async function fetchLobby(lobbyId: string): Promise<Lobby | null> {
    const data = await graphqlRequest<GetLobbyData, { id: string }>(lobbyQuery, { id: lobbyId });
    return data.lobby;
}

export async function sendLobbyMessage(lobbyId: string, text: string, sender: string): Promise<Message> {
    const data = await graphqlRequest<SendMessageData, { lobbyId: string; text: string; sender: string }>(
        sendMessageMutation,
        { lobbyId, text, sender }
    );
    return data.sendMessage;
}

export async function rollLobbyDice(lobbyId: string, playerEmail: string, diceToRoll: number[], diceSelected: boolean[]): Promise<number[]> {
  const data = await graphqlRequest<
    RollDiceData,
    { lobbyId: string; playerEmail: string; diceToRoll: number[]; diceSelected: boolean[] }
  >(rollDiceMutation, { lobbyId, playerEmail, diceToRoll, diceSelected });
  return data.rollDice.dice;
}

export async function bankTurn(lobbyId: string, playerEmail: string, currentTurnScore: number): Promise<GameState> {
    const data = await graphqlRequest<BankTurnData, { lobbyId: string; playerEmail: string; currentTurnScore: number }>(
        bankTurnMutation,
        { lobbyId, playerEmail, currentTurnScore }
    );
  return data.bankTurn;
}

export async function startGame(lobbyId: string): Promise<GameState> {
  const mutation = `
    mutation StartGame($lobbyId: ID!) {
      startGame(lobbyId: $lobbyId) {
        lobbyId
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
  `;

  const data = await graphqlRequest<{ startGame: GameState }, { lobbyId: string }>(
    mutation,
    { lobbyId }
  );
  return data.startGame;
}
