export type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    wins: number | null;
    prefcol: string | null;
};

export type Message = {
    id: string;
    text: string;
    sender: string;
};

export type MessageAddedSub = {
    messageAdded: Message;
};

export type GameState = {
    dice: number[];
    scores: number[];
    players: User[];
    currentPlayer: User;
    lastTurn: boolean;
};

export type GameStateUpdatedSub = {
    gameStateUpdated: GameState;
};