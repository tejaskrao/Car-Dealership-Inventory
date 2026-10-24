import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute.jsx'
import { adminSession, renderWithProviders, storeSession, userSession } from '../test/utils.jsx'

const setup = (props = {}) =>
  renderWithProviders(<ProtectedRoute {...props}><p>Secret</p></ProtectedRoute>, {
    routes: { '/login': <p>Login page</p>, '/': <p>Home</p> },
    path: '/secret',
    route: '/secret',
  })

beforeEach(() => localStorage.clear())

describe('ProtectedRoute', () => {
  it('sends signed-out visitors to the login page', () => {
    setup()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows the content to signed-in users', () => {
    storeSession(userSession)
    setup()
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })

  it('keeps non-admins out of admin-only content', () => {
    storeSession(userSession)
    setup({ adminOnly: true })
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('lets admins into admin-only content', () => {
    storeSession(adminSession)
    setup({ adminOnly: true })
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })
})
