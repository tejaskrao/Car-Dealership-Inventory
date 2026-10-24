import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchFilters from './SearchFilters.jsx'

describe('SearchFilters', () => {
  it('submits the entered filters', async () => {
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} onReset={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/make/i), 'Toyota')
    await userEvent.type(screen.getByLabelText(/model/i), 'Corolla')
    await userEvent.type(screen.getByLabelText(/category/i), 'Sedan')
    await userEvent.type(screen.getByLabelText(/min price/i), '10000')
    await userEvent.type(screen.getByLabelText(/max price/i), '30000')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(onSearch).toHaveBeenCalledWith({ make: 'Toyota', model: 'Corolla', category: 'Sedan', minPrice: '10000', maxPrice: '30000' })
  })

  it('refuses a minimum price above the maximum without searching', async () => {
    const onSearch = vi.fn()
    render(<SearchFilters onSearch={onSearch} onReset={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/min price/i), '50000')
    await userEvent.type(screen.getByLabelText(/max price/i), '1000')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/minimum price cannot be higher/i)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('reset clears the fields and notifies the parent', async () => {
    const onReset = vi.fn()
    render(<SearchFilters onSearch={vi.fn()} onReset={onReset} />)

    await userEvent.type(screen.getByLabelText(/make/i), 'Kia')
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByLabelText(/make/i)).toHaveValue('')
    expect(onReset).toHaveBeenCalled()
  })
})
