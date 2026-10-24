import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.js'
import * as authApi from '../api/auth.js'
import RegisterPage from './RegisterPage.jsx'
import { renderWithProviders } from '../test/utils.jsx'

vi.mock('../api/auth.js')

const setup = () =>
  renderWithProviders(<RegisterPage />, { path: '/register', route: '/register', routes: { '/': <p>Dashboard</p> } })

async function fill({ username = 'newbie', email = 'newbie@example.com', password = 'S3cure-pass!', confirm = 'S3cure-pass!' } = {}) {
  await userEvent.type(screen.getByLabelText(/^username/i), username)
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.type(screen.getByLabelText(/^password/i), password)
  await userEvent.type(screen.getByLabelText(/confirm password/i), confirm)
}

beforeEach(() => vi.resetAllMocks())

describe('RegisterPage', () => {
  it('creates the account, signs in and opens the dashboard', async () => {
    authApi.register.mockResolvedValue({ id: 9, username: 'newbie' })
    authApi.login.mockResolvedValue({ access: 't', refresh: 'r', user: { id: 9, username: 'newbie', role: 'user' } })
    setup()

    await fill()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(authApi.register).toHaveBeenCalledWith({ username: 'newbie', email: 'newbie@example.com', password: 'S3cure-pass!' })
  })

  it('blocks the request when the passwords differ', async () => {
    setup()

    await fill({ confirm: 'different' })
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i)
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('shows the server message, for example when the username is taken', async () => {
    authApi.register.mockRejectedValue(new ApiError('username: A user with that username already exists.', 400))
    setup()

    await fill()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
