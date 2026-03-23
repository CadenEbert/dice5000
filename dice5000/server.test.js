
const mockFirestoreDoc = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const mockCollection = {
    doc: jest.fn(() => mockFirestoreDoc),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
};

const mockRealtimeRef = {
    on: jest.fn(),
    child: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    push: jest.fn(() => ({ key: 'mock-key', set: jest.fn() })),
};

jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    firestore: jest.fn(() => ({
        collection: jest.fn(() => mockCollection),
    })),
    database: jest.fn(() => ({
        ref: jest.fn(() => mockRealtimeRef),
    })),
}));

jest.mock('./serviceAccount.json', () => ({ type: 'service_account' }), { virtual: true });

const baseState = {
    lobbyId: 'ABC1',
    dice: [1, 1, 1, 1, 1, 1],
    scores: [0, 0],
    players: [
        { email: 'p1@a.com' },
        { email: 'p2@a.com' },
    ],
    currentPlayerIndex: 0,
    currentPlayer: { email: 'p1@a.com' },
    lastTurn: false,
    currentTurnScore: 0,
};


const { resolvers } = require('./server');
const Query = resolvers.Query;
const Mutation = resolvers.Mutation;


beforeEach(() => jest.clearAllMocks());



describe('Query.userByEmail', () => {
    test('returns user when found', async () => {
        mockCollection.get.mockResolvedValue({
            empty: false,
            docs: [{ data: () => ({ email: 'a@a.com', displayName: 'Alice' }) }],
        });

        const user = await Query.userByEmail(null, { email: 'a@a.com' });
        expect(user.email).toBe('a@a.com');
        expect(user.displayName).toBe('Alice');
    });

    test('returns null when not found', async () => {
        mockCollection.get.mockResolvedValue({ empty: true });

        const user = await Query.userByEmail(null, { email: 'ghost@a.com' });
        expect(user).toBeNull();
    });
});



describe('Mutation.createLobby', () => {
    test('creates lobby with host as first player', async () => {
        mockFirestoreDoc.set.mockResolvedValue();

        const lobby = await Mutation.createLobby(null, { hostEmail: 'host@a.com' });

        expect(lobby.host).toBe('host@a.com');
        expect(lobby.players).toContain('host@a.com');
        expect(lobby.id).toBeDefined();
    });
});

describe('Mutation.rollDice', () => {


    test('throws if not your turn', async () => {
        mockRealtimeRef.get.mockResolvedValue({
            exists: () => true,
            val: () => ({ ...baseState }),
        });

        await expect(
            Mutation.rollDice(null, {
                lobbyId: 'ABC1',
                playerEmail: 'p2@a.com',
                diceToRoll: [0],
                diceSelected: [false, false, false, false, false, false],
            })
        ).rejects.toThrow('Not your turn');
    });

    test('scores 100 per single one', async () => {
        const state = {
            ...baseState,
            dice: [1, 2, 3, 4, 6, 6],
        };

        mockRealtimeRef.get.mockResolvedValue({ exists: () => true, val: () => ({ ...state }) });
        mockRealtimeRef.set.mockResolvedValue();

        
        jest.spyOn(Math, 'random').mockReturnValue(0.0);

        const result = await Mutation.rollDice(null, {
            lobbyId: 'ABC1',
            playerEmail: 'p1@a.com',
            diceToRoll: [0], 
            diceSelected: [false, false, false, false, false, false],
        });

        expect(result.currentTurnScore).toBeGreaterThanOrEqual(100);
        jest.spyOn(Math, 'random').mockRestore();
    });

    test('advances turn when rolled nothing', async () => {
        const state = { ...baseState };

        mockRealtimeRef.get.mockResolvedValue({ exists: () => true, val: () => ({ ...state }) });
        mockRealtimeRef.set.mockResolvedValue();

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.9);

        const result = await Mutation.rollDice(null, {
            lobbyId: 'ABC1',
            playerEmail: 'p1@a.com',
            diceToRoll: [0, 1, 2, 3, 4, 5],
            diceSelected: [false, false, false, false, false, false],
        });

        expect(result.currentTurnScore).toBe(0);
        expect(result.currentPlayer.email).toBe('p2@a.com');

        jest.spyOn(Math, 'random').mockRestore();
    });

    
});

describe('Mutation.bankTurn', () => {
    test('adds score and advances turn', async () => {
        const state = {
            ...baseState,
            currentTurnScore: 350,
            scores: [0, 0],
        };

        mockRealtimeRef.get.mockResolvedValue({ exists: () => true, val: () => ({ ...state }) });
        mockRealtimeRef.set.mockResolvedValue();

        const result = await Mutation.bankTurn(null, {
            lobbyId: 'ABC1',
            playerEmail: 'p1@a.com',
            currentTurnScore: 350,
        });

        expect(result.currentPlayer.email).toBe('p2@a.com');
        expect(result.currentTurnScore).toBe(0);
    });

    test('sets lastTurn when a player hits 5000', async () => {
        const state = {
            ...baseState,
            scores: [4800, 0],
        };

        mockRealtimeRef.get.mockResolvedValue({ exists: () => true, val: () => ({ ...state }) });
        mockRealtimeRef.set.mockResolvedValue();

        const result = await Mutation.bankTurn(null, {
            lobbyId: 'ABC1',
            playerEmail: 'p1@a.com',
            currentTurnScore: 300,
        });

        expect(result.lastTurn).toBe(true);
    });

    afterAll(() => {
        const { httpServer } = require('./server');
        httpServer.close();
    });
});