import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client.js'

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends JSON bodies with the right headers and returns the parsed response', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 1 }, 201))

    const data = await request('/api/vehicles', { method: 'POST', body: { make: 'Kia' } })

    const [url, options] = fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/vehicles$/)
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ make: 'Kia' })
    expect(data).toEqual({ id: 1 })
  })

  it('adds the bearer token when one is given', async () => {
    fetch.mockResolvedValue(jsonResponse([]))

    await request('/api/vehicles', { token: 'abc123' })

    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123')
  })

  it('does not send an Authorization header without a token', async () => {
    fetch.mockResolvedValue(jsonResponse([]))

    await request('/api/vehicles')

    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('returns null for an empty 204 response', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('no body') } })

    expect(await request('/api/vehicles/1', { method: 'DELETE', token: 't' })).toBeNull()
  })

  it('throws an ApiError carrying the status and the server "detail" message', async () => {
    fetch.mockResolvedValue(jsonResponse({ detail: 'Only 2 unit(s) in stock, 5 requested.' }, 409))

    const error = await request('/api/vehicles/1/purchase', { method: 'POST' }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe('Only 2 unit(s) in stock, 5 requested.')
  })

  it('turns field validation errors into a readable message and keeps them per field', async () => {
    fetch.mockResolvedValue(jsonResponse({ price: ['Ensure this value is greater than or equal to 0.'] }, 400))

    const error = await request('/api/vehicles', { method: 'POST', body: {} }).catch((e) => e)

    expect(error.status).toBe(400)
    expect(error.message).toMatch(/price/i)
    expect(error.fieldErrors.price).toEqual(['Ensure this value is greater than or equal to 0.'])
  })

  it('reports a friendly error when the server cannot be reached', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await request('/api/vehicles').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/cannot reach the server/i)
  })
})
