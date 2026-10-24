import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.js'
import * as authApi from '../api/auth.js'
import LoginPage from './LoginPage.jsx'
import { renderWithProviders } from '../test/utils.jsx'

vi.mock('../api/auth.js')

const setup = () =>
  renderWithProviders(<LoginPage />, { path: '/login', route: '/login', routes: { '/': <p>Dashboard</p>, '/register': <p>Register page</p> } })

beforeEach(() => vi.resetAllMocks())

describe('LoginPage', () => {
  it('has labelled username and password fields and a sign-in button', () => {
    setup()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('signs in and goes to the dashboard', async () => {
    authApi.login.mockResolvedValue({ access: 't', refresh: 'r', user: { id: 1, username: 'sam', role: 'user' } })
    setup()

    await userEvent.type(screen.getByLabelText(/username/i), 'sam')
    await userEvent.type(screen.getByLabelText(/password/i), 'S3cure-pass!')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/'))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith('sam', 'S3cure-pass!')
  })

  it('shows the server error and stays on the page when the login fails', async () => {
    authApi.login.mockRejectedValue(new ApiError('No active account found with the given credentials', 401))
    setup()

    await userEvent.type(screen.getByLabelText(/username/i), 'sam')
    await userEvent.type(screen.getByLabelText(/password/i), 'bad')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no active account/i)
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('does not call the API when a field is empty', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter your username and password/i)
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('links to the registration page', async () => {
    setup()

    await userEvent.click(screen.getByRole('link', { name: /create an account/i }))

    expect(screen.getByText('Register page')).toBeInTheDocument()
  })
})
