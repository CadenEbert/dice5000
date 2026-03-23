import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Auth from '@/app/components/Auth'
import { getAuth, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'

jest.mock('../lib/firebase', () => ({
  __esModule: true,
  default: {},
  database: {},
}))

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithPopup: jest.fn().mockResolvedValue({}),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  GoogleAuthProvider: jest.fn(function GoogleAuthProvider() {}),
  GithubAuthProvider: jest.fn(function GithubAuthProvider() {}),
}))

const mockedGetAuth = getAuth as jest.Mock
const mockedSignInWithPopup = signInWithPopup as jest.Mock
const mockedSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock

describe('Auth page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders auth options', () => {
        render(<Auth />)

        expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument()
    })

    it('signs in with Google and redirects', async () => {
        render(<Auth />)

        fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }))

        await waitFor(() => {
            expect(mockedSignInWithPopup).toHaveBeenCalled()
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    it('signs in with email/password and redirects', async () => {
        render(<Auth />)

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'secret123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in with email/i }))

        await waitFor(() => {
            expect(mockedSignInWithEmailAndPassword).toHaveBeenCalled()
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })
})