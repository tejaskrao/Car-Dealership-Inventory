import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as vehiclesApi from './api/vehicles.js'
import App from './App.jsx'
import { storeSession, userSession } from './test/utils.jsx'

vi.mock('./api/vehicles.js')

const renderAt = (route) => render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>)

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vehiclesApi.listVehicles.mockResolvedValue([])
})

describe('App routing', () => {
  it('redirects signed-out visitors to the sign-in page', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows the dashboard to signed-in users', async () => {
    storeSession(userSession)
    renderAt('/')
    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
    expect(screen.getByText('buyer')).toBeInTheDocument()
  })

  it('sends signed-in users away from the sign-in page', async () => {
    storeSession(userSession)
    renderAt('/login')
    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
  })

  it('renders the registration page', () => {
    renderAt('/register')
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown URLs', () => {
    renderAt('/nope')
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })
})
