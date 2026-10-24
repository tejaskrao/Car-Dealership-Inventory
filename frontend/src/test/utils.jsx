import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'

/** Shows the current path so tests can assert where the app navigated to. */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

/**
 * Renders `ui` inside a router and the AuthProvider.
 * `routes` lets a test register extra destinations, e.g. { '/': <p>Home</p> }.
 */
export function renderWithProviders(ui, { route = '/', path = '/', routes = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
          {Object.entries(routes).map(([p, element]) => (
            <Route key={p} path={p} element={element} />
          ))}
        </Routes>
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  )
}

export const adminSession = {
  token: 'admin-token',
  user: { id: 1, username: 'boss', email: 'boss@example.com', role: 'admin' },
}
export const userSession = {
  token: 'user-token',
  user: { id: 2, username: 'buyer', email: 'buyer@example.com', role: 'user' },
}

export function storeSession(session) {
  localStorage.setItem('drivehub.auth', JSON.stringify(session))
}
