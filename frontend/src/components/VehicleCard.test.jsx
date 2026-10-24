import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VehicleCard from './VehicleCard.jsx'

const vehicle = { id: 5, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: '22500.00', quantity: 4 }
const handlers = () => ({ onPurchase: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onRestock: vi.fn() })

describe('VehicleCard', () => {
  it('shows make, model, category, formatted price and stock', () => {
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...handlers()} />)
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByText('Sedan')).toBeInTheDocument()
    expect(screen.getByText('$22,500')).toBeInTheDocument()
    expect(screen.getByText(/4 in stock/i)).toBeInTheDocument()
  })

  it('purchases one unit when Purchase is clicked', async () => {
    const h = handlers()
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /purchase/i }))
    expect(h.onPurchase).toHaveBeenCalledWith(vehicle)
  })

  it('disables Purchase and says Out of stock at quantity 0', () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} isAdmin={false} {...handlers()} />)
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled()
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })

  it('shows a low-stock hint for 1 to 3 units', () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 2 }} isAdmin={false} {...handlers()} />)
    expect(screen.getByText(/only 2 left/i)).toBeInTheDocument()
  })

  it('hides admin controls from regular users', () => {
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...handlers()} />)
    for (const name of [/edit/i, /delete/i, /restock/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
  })

  it('gives admins edit, restock and delete', async () => {
    const h = handlers()
    render(<VehicleCard vehicle={vehicle} isAdmin {...h} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    await userEvent.click(screen.getByRole('button', { name: /restock/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(h.onEdit).toHaveBeenCalledWith(vehicle)
    expect(h.onRestock).toHaveBeenCalledWith(vehicle)
    expect(h.onDelete).toHaveBeenCalledWith(vehicle)
  })
})
