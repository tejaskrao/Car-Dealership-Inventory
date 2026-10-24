import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Navbar from './Navbar.jsx'
import { adminSession, renderWithProviders, storeSession, userSession } from '../test/utils.jsx'

beforeEach(() => localStorage.clear())

describe('Navbar', () => {
  it('shows the signed-in username and role', () => {
    storeSession(adminSession)
    renderWithProviders(<Navbar />)
    expect(screen.getByText('boss')).toBeInTheDocument()
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('shows the customer role for regular users', () => {
    storeSession(userSession)
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/customer/i)).toBeInTheDocument()
  })

  it('logs out and returns to the login page', async () => {
    storeSession(userSession)
    renderWithProviders(<Navbar />, { routes: { '/login': <p>Login page</p> } })

    await userEvent.click(screen.getByRole('button', { name: /log out/i }))

    expect(localStorage.getItem('drivehub.auth')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
