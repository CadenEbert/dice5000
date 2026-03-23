import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import Page from './page'


const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockUseAuthState = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

jest.mock('./components/useAuthState', () => ({
  useAuthState: () => mockUseAuthState(),
}))

describe('Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseAuthState.mockReturnValue({
            user: { email: 'test@example.com' },
            loading: false,
            isAuthenticated: true,
        })
    })


  it('renders lobby actions for authenticated users', () => {
    render(<Page />)

    expect(screen.getByRole('button', { name: /host game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join game/i })).toBeInTheDocument()
  })

  it('redirects to login if not authenticated', async () => {
    mockUseAuthState.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(<Page />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('shows loading state', () => {
    mockUseAuthState.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
    })
    
    render(<Page />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})