import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from './client.js'
import * as auth from './auth.js'

vi.mock('./client.js')

beforeEach(() => {
  vi.resetAllMocks()
  client.request.mockResolvedValue({})
})

// These paths must match backend/accounts/urls.py exactly (no trailing slash).
describe('auth API', () => {
  it('posts credentials to /api/auth/login', async () => {
    await auth.login('sam', 'pw')
    expect(client.request).toHaveBeenCalledWith('/api/auth/login', { method: 'POST', body: { username: 'sam', password: 'pw' } })
  })

  it('posts the new account to /api/auth/register', async () => {
    await auth.register({ username: 'sam', email: 's@example.com', password: 'pw' })
    expect(client.request).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: { username: 'sam', email: 's@example.com', password: 'pw' },
    })
  })
})
