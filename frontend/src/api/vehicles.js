import { request } from './client.js'

export const listVehicles = (token) => request('/api/vehicles', { token })

export function searchVehicles(token, { make, model, category, minPrice, maxPrice } = {}) {
  const raw = { make, model, category, min_price: minPrice, max_price: maxPrice }
  const query = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return request('/api/vehicles/search', { token, query })
}

export const createVehicle = (token, data) => request('/api/vehicles', { method: 'POST', token, body: data })

export const updateVehicle = (token, id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', token, body: data })

export const deleteVehicle = (token, id) => request(`/api/vehicles/${id}`, { method: 'DELETE', token })

export const purchaseVehicle = (token, id, quantity = 1) =>
  request(`/api/vehicles/${id}/purchase`, { method: 'POST', token, body: { quantity } })

export const restockVehicle = (token, id, quantity) =>
  request(`/api/vehicles/${id}/restock`, { method: 'POST', token, body: { quantity } })
