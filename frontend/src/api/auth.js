import { request } from './client.js'

export const login = (username, password) =>
  request('/api/auth/login/', { method: 'POST', body: { username, password } })

export const register = ({ username, email, password }) =>
  request('/api/auth/register/', { method: 'POST', body: { username, email, password } })
