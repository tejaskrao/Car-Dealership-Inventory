// Thin wrapper around fetch so every API call handles JSON, auth and errors the same way.

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 means the server could not be reached
    this.fieldErrors = fieldErrors // e.g. { price: ['Ensure this value ...'] }
  }
}

/** Build one human-readable sentence from a DRF error body. */
function messageFrom(body, status) {
  if (body && typeof body.detail === 'string') return body.detail
  if (body && typeof body === 'object') {
    const parts = Object.entries(body).map(([field, errors]) => {
      const text = Array.isArray(errors) ? errors.join(' ') : String(errors)
      return field === 'non_field_errors' ? text : `${field}: ${text}`
    })
    if (parts.length) return parts.join(' ')
  }
  return `Request failed (${status}).`
}

export async function request(path, { method = 'GET', body, token, query } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const queryString = query ? new URLSearchParams(query).toString() : ''
  const url = `${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0)
  }

  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-JSON body (e.g. a proxy error page) - fall through with data = null
  }

  if (!response.ok) {
    const fieldErrors = data && typeof data === 'object' && !data.detail ? data : {}
    throw new ApiError(messageFrom(data, response.status), response.status, fieldErrors)
  }
  return data
}
