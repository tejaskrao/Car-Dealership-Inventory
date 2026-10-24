import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VehicleForm from './VehicleForm.jsx'

const existing = { id: 3, make: 'Honda', model: 'Civic', category: 'Sedan', price: '21000.00', quantity: 5 }

describe('VehicleForm', () => {
  it('creates a vehicle with numeric price and quantity', async () => {
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/make/i), 'Kia')
    await userEvent.type(screen.getByLabelText(/model/i), 'Seltos')
    await userEvent.type(screen.getByLabelText(/category/i), 'SUV')
    await userEvent.type(screen.getByLabelText(/price/i), '19000.50')
    await userEvent.type(screen.getByLabelText(/quantity/i), '3')
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(onSubmit).toHaveBeenCalledWith({ make: 'Kia', model: 'Seltos', category: 'SUV', price: '19000.50', quantity: 3 })
  })

  it('pre-fills the form when editing', () => {
    render(<VehicleForm vehicle={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/make/i)).toHaveValue('Honda')
    expect(screen.getByLabelText(/price/i)).toHaveValue(21000)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('blocks empty required fields', async () => {
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/fill in all fields/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a negative price and a fractional quantity', async () => {
    const onSubmit = vi.fn()
    render(<VehicleForm vehicle={existing} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/price/i))
    await userEvent.type(screen.getByLabelText(/price/i), '-5')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/price must be/i)

    await userEvent.clear(screen.getByLabelText(/price/i))
    await userEvent.type(screen.getByLabelText(/price/i), '100')
    await userEvent.clear(screen.getByLabelText(/quantity/i))
    await userEvent.type(screen.getByLabelText(/quantity/i), '1.5')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/quantity must be a whole number/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error passed in from the server and can be cancelled', async () => {
    const onCancel = vi.fn()
    render(<VehicleForm onSubmit={vi.fn()} onCancel={onCancel} error="price: Ensure this value is greater than or equal to 0." />)
    expect(screen.getByRole('alert')).toHaveTextContent(/greater than or equal to 0/i)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
