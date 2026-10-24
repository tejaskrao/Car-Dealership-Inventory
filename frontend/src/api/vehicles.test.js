import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from './client.js'
import * as vehicles from './vehicles.js'

vi.mock('./client.js')

beforeEach(() => {
  vi.resetAllMocks()
  client.request.mockResolvedValue([])
})

describe('vehicles API', () => {
  it('lists all vehicles with the token', async () => {
    await vehicles.listVehicles('tok')
    expect(client.request).toHaveBeenCalledWith('/api/vehicles', { token: 'tok' })
  })

  it('searches using only the filters that have a value', async () => {
    await vehicles.searchVehicles('tok', { make: 'Toyota', model: '', category: 'SUV', minPrice: '20000', maxPrice: '' })
    expect(client.request).toHaveBeenCalledWith('/api/vehicles/search', {
      token: 'tok',
      query: { make: 'Toyota', category: 'SUV', min_price: '20000' },
    })
  })

  it('creates a vehicle', async () => {
    const data = { make: 'Kia', model: 'Seltos', category: 'SUV', price: '19000', quantity: 3 }
    await vehicles.createVehicle('tok', data)
    expect(client.request).toHaveBeenCalledWith('/api/vehicles', { method: 'POST', token: 'tok', body: data })
  })

  it('updates a vehicle with PUT', async () => {
    const data = { make: 'Kia', model: 'Seltos', category: 'SUV', price: '19500', quantity: 3 }
    await vehicles.updateVehicle('tok', 7, data)
    expect(client.request).toHaveBeenCalledWith('/api/vehicles/7', { method: 'PUT', token: 'tok', body: data })
  })

  it('deletes a vehicle', async () => {
    await vehicles.deleteVehicle('tok', 7)
    expect(client.request).toHaveBeenCalledWith('/api/vehicles/7', { method: 'DELETE', token: 'tok' })
  })

  it('purchases and restocks with a quantity body', async () => {
    await vehicles.purchaseVehicle('tok', 7, 2)
    expect(client.request).toHaveBeenCalledWith('/api/vehicles/7/purchase', { method: 'POST', token: 'tok', body: { quantity: 2 } })
    await vehicles.restockVehicle('tok', 7, 10)
    expect(client.request).toHaveBeenCalledWith('/api/vehicles/7/restock', { method: 'POST', token: 'tok', body: { quantity: 10 } })
  })
})
