import '@testing-library/jest-dom'
import Page from './page'
import { fetchLobby, sendLobbyMessage } from '@/app/services/api.service'
import { listenToGameState, subscribeToMessages } from '@/app/services/subscriptions.service'
import { GameState } from '@/app/services/types'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'


const user = {
    email: 'test@gmail.com',
    wins: 0,
    displayName: 'Test User',
    uid: '123',
    prefcol: '#000000'
}



const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
    useParams: jest.fn(() => ({ id: 'test-lobby-id' })),
}))

jest.mock('../../services/api.service', () => ({
    fetchLobby: jest.fn().mockResolvedValue({ players: [] }),
    fetchUserByEmail: jest.fn().mockResolvedValue(null),
    rollLobbyDice: jest.fn().mockResolvedValue(null),
    sendLobbyMessage: jest.fn().mockResolvedValue(null),
    startGame: jest.fn().mockResolvedValue(null),
    bankTurn: jest.fn().mockResolvedValue(null),
    closeLobby: jest.fn().mockResolvedValue(null),
    incrementWins: jest.fn().mockResolvedValue(null),
}))

jest.mock('../../services/subscriptions.service', () => ({
    subscribeToMessages: jest.fn().mockReturnValue(jest.fn()),
    listenToGameState: jest.fn().mockReturnValue(jest.fn()),
    listenToDiceState: jest.fn().mockReturnValue(jest.fn()),
}))

const mockUseAuthState = jest.fn()

jest.mock('../../components/useAuthState', () => ({
    useAuthState: () => {
        return mockUseAuthState()
    }
}))



describe('Lobby Page', () => {
    beforeEach(() => {
        mockPush.mockReset()
        mockReplace.mockReset()
        mockUseAuthState.mockReset()
            ;(sendLobbyMessage as jest.Mock).mockClear()
            ; (fetchLobby as jest.Mock).mockResolvedValue({ players: [] })
            ; (listenToGameState as jest.Mock).mockReturnValue(jest.fn())
            ; (subscribeToMessages as jest.Mock).mockReturnValue(jest.fn())
        window.HTMLElement.prototype.scrollIntoView = jest.fn()
        window.alert = jest.fn()
    })

    it('renders lobby for authenticated users', () => {
        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })
        render(<Page />)
        expect(screen.getByText((content, element) => {
            return element?.tagName === 'H1' && element.textContent?.includes('Lobby Code: test-lobby-id') === true
        })).toBeInTheDocument()
    })

    it('shows players names and scores', async () => {
        let gameStateListener: ((state: GameState) => void) | undefined


            ; (fetchLobby as jest.Mock).mockResolvedValue({ players: [user] })

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(gameStateListener).toBeDefined()

        await act(async () => {
            gameStateListener!({
                lastTurn: false,
                currentPlayer: user,
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })

        expect(screen.getByText((content, element) => {
            return element?.tagName === 'H1' && element.textContent?.includes('Test User') === true
        })).toBeInTheDocument()
    })



    

    it('redirects if lobby is not found', async () => {
        (fetchLobby as jest.Mock).mockResolvedValueOnce(null)

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
        })

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    it('redirects if game is over', async () => {
        let gameStateListener: (state: GameState) => void

            ; (fetchLobby as jest.Mock).mockResolvedValue({ players: [] })

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback: (state: GameState) => void) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        await act(async () => {
            gameStateListener({
                lastTurn: true,
                currentPlayer: user,
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })



        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/')
        })

    })

    it('dice buttons are enabled when it is the players turn', async () => {
        let gameStateListener: (state: GameState) => void

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback: (state: GameState) => void) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        await act(async () => {
            gameStateListener({
                lastTurn: false,
                currentPlayer: user,
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })

        for (let i = 1; i <= 6; i++) {
            expect(document.getElementById(`die${i}`)).not.toBeDisabled()
        }
        expect(screen.getByText('ROLL')).not.toBeDisabled()
    })

    it('dice buttons are disabled when it is not the players turn', async () => {
        let gameStateListener: (state: GameState) => void

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback: (state: GameState) => void) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        await act(async () => {
            gameStateListener({
                lastTurn: false,
                currentPlayer: { ...user, uid: 'other-uid', email: 'other@gmail.com' },
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })

        for (let i = 1; i <= 6; i++) {
            expect(document.getElementById(`die${i}`)).toBeDisabled()
        }

    })

    it('rolls when its the players turn', async () => {
        let gameStateListener: (state: GameState) => void

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback: (state: GameState) => void) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        await act(async () => {
            gameStateListener({
                lastTurn: false,
                currentPlayer: user,
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })

        const rollButton = screen.getByText('ROLL')
        expect(rollButton).not.toBeDisabled()
        act(() => {
            rollButton.click()
        })

        await waitFor(() => {
            expect(fetchLobby).toHaveBeenCalledWith('test-lobby-id')
        })
    })
    it('bank when its the players turn', async () => {
        let gameStateListener: (state: GameState) => void

            ; (listenToGameState as jest.Mock).mockImplementation((_lobbyId: string, callback: (state: GameState) => void) => {
                gameStateListener = callback
                return jest.fn()
            })

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        await act(async () => {
            gameStateListener({
                lastTurn: false,
                currentPlayer: user,
                dice: [1, 2, 3, 4, 5, 6],
                currentTurnScore: 0,
                players: [user],
                scores: [0],
            })
        })

        const bankButton = screen.getByText('BANK')
        expect(bankButton).not.toBeDisabled()
        act(() => {
            bankButton.click()
        })

        await waitFor(() => {
            expect(fetchLobby).toHaveBeenCalledWith('test-lobby-id')
        })
    })

    it('calls send message when enter is pressed', async () => {
        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        const chatInput = screen.getByPlaceholderText('chat')

        fireEvent.change(chatInput, { target: { value: 'hello world' } })
        fireEvent.keyDown(chatInput, { key: 'Enter' })

        await waitFor(() => {
            expect(sendLobbyMessage).toHaveBeenCalledWith('test-lobby-id', 'hello world', expect.any(String))
        })


    })
    it('doesnt send message when non enter key is pressed', async () => {
        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        await act(async () => {
            render(<Page />)
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        })

        const chatInput = screen.getByPlaceholderText('chat')

        fireEvent.change(chatInput, { target: { value: 'hello world' } })
        fireEvent.keyDown(chatInput, { key: 'K' })

        await waitFor(() => {
            expect(sendLobbyMessage).not.toHaveBeenCalledWith('test-lobby-id', 'hello world', expect.any(String))
        })


    })

    it('should unsubscribe from messages and game state on unmount', async () => {
        const mockUnsubscribeMessages: jest.Mock = jest.fn()
        const mockUnsubscribeGameState: jest.Mock = jest.fn()

            ; (listenToGameState as jest.Mock).mockReturnValue(mockUnsubscribeGameState)
            ; (subscribeToMessages as jest.Mock).mockReturnValue(mockUnsubscribeMessages)

        mockUseAuthState.mockReturnValue({
            user: user,
            loading: false,
            isAuthenticated: true,
        })

        const { unmount } = render(<Page />)

        await act(async () => {
            unmount()
        })

        expect(mockUnsubscribeGameState).toHaveBeenCalled()
        expect(mockUnsubscribeMessages).toHaveBeenCalled()
    })

})