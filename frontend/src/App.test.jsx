import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('the app renders its brand name', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /drivehub/i })).toBeInTheDocument()
})
