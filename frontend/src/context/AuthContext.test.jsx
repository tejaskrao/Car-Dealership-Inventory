import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.js'
import * as authApi from '../api/auth.js'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { adminSession, storeSession } from '../test/utils.jsx'

vi.mock('../api/auth.js')

let auth
function Probe() {
  auth = useAuth()
  return <p>{auth.user ? `signed in as ${auth.user.username}` : 'signed out'}</p>
}
const mount = () => render(<AuthProvider><Probe /></AuthProvider>)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AuthContext', () => {
  it('starts signed out when nothing is stored', () => {
    mount()
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.isAdmin).toBe(false)
  })

  it('restores a saved session', () => {
    storeSession(adminSession)
    mount()
    expect(screen.getByText('signed in as boss')).toBeInTheDocument()
    expect(auth.token).toBe('admin-token')
    expect(auth.isAdmin).toBe(true)
  })

  it('ignores a corrupted saved session instead of crashing', () => {
    localStorage.setItem('drivehub.auth', '{not json')
    mount()
    expect(screen.getByText('signed out')).toBeInTheDocument()
  })

  it('login stores the token and user and persists them', async () => {
    authApi.login.mockResolvedValue({ access: 'tok', refresh: 'ref', user: { id: 3, username: 'sam', role: 'user' } })
    mount()

    await act(() => auth.login('sam', 'S3cure-pass!'))

    expect(authApi.login).toHaveBeenCalledWith('sam', 'S3cure-pass!')
    expect(screen.getByText('signed in as sam')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('drivehub.auth')).token).toBe('tok')
  })

  it('a failed login stays signed out and rethrows the error for the form to show', async () => {
    authApi.login.mockRejectedValue(new ApiError('No active account found with the given credentials', 401))
    mount()

    await expect(act(() => auth.login('sam', 'wrong'))).rejects.toThrow(/no active account/i)

    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(localStorage.getItem('drivehub.auth')).toBeNull()
  })

  it('register creates the account and then signs the user in', async () => {
    authApi.register.mockResolvedValue({ id: 4, username: 'newbie' })
    authApi.login.mockResolvedValue({ access: 'tok2', refresh: 'r', user: { id: 4, username: 'newbie', role: 'user' } })
    mount()

    await act(() => auth.register({ username: 'newbie', email: 'n@example.com', password: 'S3cure-pass!' }))

    expect(authApi.register).toHaveBeenCalledWith({ username: 'newbie', email: 'n@example.com', password: 'S3cure-pass!' })
    expect(authApi.login).toHaveBeenCalledWith('newbie', 'S3cure-pass!')
    expect(screen.getByText('signed in as newbie')).toBeInTheDocument()
  })

  it('logout clears the session everywhere', () => {
    storeSession(adminSession)
    mount()

    act(() => auth.logout())

    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(localStorage.getItem('drivehub.auth')).toBeNull()
  })
})
