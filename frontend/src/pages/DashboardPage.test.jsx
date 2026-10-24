import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.js'
import * as vehiclesApi from '../api/vehicles.js'
import DashboardPage from './DashboardPage.jsx'
import { adminSession, renderWithProviders, storeSession, userSession } from '../test/utils.jsx'

vi.mock('../api/vehicles.js')

const corolla = { id: 1, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: '22500.00', quantity: 4 }
const seltos = { id: 2, make: 'Kia', model: 'Seltos', category: 'SUV', price: '19000.00', quantity: 0 }

const setup = (session = userSession) => {
  storeSession(session)
  return renderWithProviders(<DashboardPage />)
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vehiclesApi.listVehicles.mockResolvedValue([corolla, seltos])
})

describe('DashboardPage - browsing', () => {
  it('loads and lists vehicles with the signed-in token', async () => {
    setup()
    expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByText('Kia Seltos')).toBeInTheDocument()
    expect(vehiclesApi.listVehicles).toHaveBeenCalledWith('user-token')
  })

  it('shows a loading state first', async () => {
    setup()
    expect(screen.getByText(/loading inventory/i)).toBeInTheDocument()
    await screen.findByText('Toyota Corolla')
  })

  it('shows an empty state when there are no vehicles', async () => {
    vehiclesApi.listVehicles.mockResolvedValue([])
    setup()
    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
  })

  it('shows an error with a retry when loading fails', async () => {
    vehiclesApi.listVehicles.mockRejectedValueOnce(new ApiError('Cannot reach the server', 0))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the server/i)

    vehiclesApi.listVehicles.mockResolvedValue([corolla])
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument()
  })

  it('searches through the search endpoint and resets to the full list', async () => {
    vehiclesApi.searchVehicles.mockResolvedValue([corolla])
    setup()
    await screen.findByText('Kia Seltos')

    await userEvent.type(screen.getByLabelText(/^make/i), 'Toyota')
    await userEvent.click(screen.getByRole('button', { name: /^search/i }))

    await waitFor(() => expect(screen.queryByText('Kia Seltos')).not.toBeInTheDocument())
    expect(vehiclesApi.searchVehicles).toHaveBeenCalledWith('user-token', expect.objectContaining({ make: 'Toyota' }))

    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(await screen.findByText('Kia Seltos')).toBeInTheDocument()
  })

  it('tells the user when a search matches nothing', async () => {
    vehiclesApi.searchVehicles.mockResolvedValue([])
    setup()
    await screen.findByText('Toyota Corolla')

    await userEvent.type(screen.getByLabelText(/^make/i), 'Zzz')
    await userEvent.click(screen.getByRole('button', { name: /^search/i }))

    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
  })
})

describe('DashboardPage - purchasing', () => {
  it('purchases a vehicle, updates the stock and confirms', async () => {
    vehiclesApi.purchaseVehicle.mockResolvedValue({ ...corolla, quantity: 3 })
    setup()
    const card = (await screen.findByText('Toyota Corolla')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /purchase/i }))

    expect(vehiclesApi.purchaseVehicle).toHaveBeenCalledWith('user-token', 1, 1)
    expect(await within(card).findByText(/only 3 left/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/purchased toyota corolla/i)
  })

  it('shows the conflict message when someone else bought the last unit', async () => {
    vehiclesApi.purchaseVehicle.mockRejectedValue(new ApiError('Only 0 unit(s) of Toyota Corolla in stock.', 409))
    setup()
    const card = (await screen.findByText('Toyota Corolla')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /purchase/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/in stock/i)
  })
})

describe('DashboardPage - customer view', () => {
  it('has no admin controls', async () => {
    setup(userSession)
    await screen.findByText('Toyota Corolla')
    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })
})

describe('DashboardPage - admin', () => {
  it('adds a vehicle from the dialog', async () => {
    const created = { id: 9, make: 'Ford', model: 'Focus', category: 'Hatch', price: '15000.00', quantity: 2 }
    vehiclesApi.createVehicle.mockResolvedValue(created)
    setup(adminSession)
    await screen.findByText('Toyota Corolla')

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/make/i), 'Ford')
    await userEvent.type(within(dialog).getByLabelText(/model/i), 'Focus')
    await userEvent.type(within(dialog).getByLabelText(/category/i), 'Hatch')
    await userEvent.type(within(dialog).getByLabelText(/price/i), '15000')
    await userEvent.type(within(dialog).getByLabelText(/quantity/i), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: /add vehicle/i }))

    expect(vehiclesApi.createVehicle).toHaveBeenCalledWith('admin-token', { make: 'Ford', model: 'Focus', category: 'Hatch', price: '15000', quantity: 2 })
    expect(await screen.findByText('Ford Focus')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and shows the server error when saving fails', async () => {
    vehiclesApi.createVehicle.mockRejectedValue(new ApiError('price: Ensure this value is greater than or equal to 0.', 400))
    setup(adminSession)
    await screen.findByText('Toyota Corolla')

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))
    const dialog = screen.getByRole('dialog')
    for (const [label, value] of [[/make/i, 'A'], [/model/i, 'B'], [/category/i, 'C'], [/price/i, '1'], [/quantity/i, '1']]) {
      await userEvent.type(within(dialog).getByLabelText(label), value)
    }
    await userEvent.click(within(dialog).getByRole('button', { name: /add vehicle/i }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/greater than or equal to 0/i)
  })

  it('edits a vehicle', async () => {
    vehiclesApi.updateVehicle.mockResolvedValue({ ...corolla, price: '23000.00' })
    setup(adminSession)
    const card = (await screen.findByText('Toyota Corolla')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /edit/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.clear(within(dialog).getByLabelText(/price/i))
    await userEvent.type(within(dialog).getByLabelText(/price/i), '23000')
    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }))

    expect(vehiclesApi.updateVehicle).toHaveBeenCalledWith('admin-token', 1, expect.objectContaining({ price: '23000' }))
    expect(await screen.findByText('$23,000')).toBeInTheDocument()
  })

  it('asks for confirmation before deleting, and can be cancelled', async () => {
    setup(adminSession)
    const card = (await screen.findByText('Toyota Corolla')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /delete/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/delete toyota corolla/i)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(vehiclesApi.deleteVehicle).not.toHaveBeenCalled()
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
  })

  it('deletes after confirmation', async () => {
    vehiclesApi.deleteVehicle.mockResolvedValue(null)
    setup(adminSession)
    const card = (await screen.findByText('Toyota Corolla')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /delete/i }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }))

    expect(vehiclesApi.deleteVehicle).toHaveBeenCalledWith('admin-token', 1)
    await waitFor(() => expect(screen.queryByText('Toyota Corolla')).not.toBeInTheDocument())
  })

  it('restocks by the chosen quantity', async () => {
    vehiclesApi.restockVehicle.mockResolvedValue({ ...seltos, quantity: 10 })
    setup(adminSession)
    const card = (await screen.findByText('Kia Seltos')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /restock/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/units to add/i), '10')
    await userEvent.click(within(dialog).getByRole('button', { name: /^restock$/i }))

    expect(vehiclesApi.restockVehicle).toHaveBeenCalledWith('admin-token', 2, 10)
    expect(await within(card).findByText(/10 in stock/i)).toBeInTheDocument()
  })

  it('rejects a restock quantity below one', async () => {
    setup(adminSession)
    const card = (await screen.findByText('Kia Seltos')).closest('article')

    await userEvent.click(within(card).getByRole('button', { name: /restock/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/units to add/i), '0')
    await userEvent.click(within(dialog).getByRole('button', { name: /^restock$/i }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/whole number of at least 1/i)
    expect(vehiclesApi.restockVehicle).not.toHaveBeenCalled()
  })
})
