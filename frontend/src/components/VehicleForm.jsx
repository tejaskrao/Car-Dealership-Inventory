import { useState } from 'react'

const input =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

export default function VehicleForm({ vehicle, onSubmit, onCancel, error = '', busy = false }) {
  const editing = Boolean(vehicle)
  const [form, setForm] = useState({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
  })
  const [localError, setLocalError] = useState('')

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  function submit(e) {
    e.preventDefault()
    const { make, model, category, price, quantity } = form
    if (![make, model, category, price, quantity].every((v) => v.trim() !== '')) {
      return setLocalError('Fill in all fields.')
    }
    if (!(Number(price) >= 0) || Number.isNaN(Number(price))) {
      return setLocalError('Price must be a number that is 0 or more.')
    }
    if (!/^\d+$/.test(quantity.trim())) {
      return setLocalError('Quantity must be a whole number that is 0 or more.')
    }
    setLocalError('')
    onSubmit({
      make: make.trim(),
      model: model.trim(),
      category: category.trim(),
      price: price.trim(),
      quantity: Number(quantity),
    })
  }

  const field = (label, name, type = 'text', extra = {}) => (
    <div>
      <label htmlFor={`v-${name}`} className="block text-sm font-medium text-slate-700">{label}</label>
      <input id={`v-${name}`} name={name} type={type} value={form[name]} onChange={update} className={input} {...extra} />
    </div>
  )
  const message = localError || error

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {message && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{message}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('Make', 'make')}
        {field('Model', 'model')}
        {field('Category', 'category')}
        {field('Price', 'price', 'number', { step: '0.01', min: 0 })}
        {field('Quantity', 'quantity', 'number', { min: 0, step: 1 })}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {editing ? 'Save changes' : 'Add vehicle'}
        </button>
      </div>
    </form>
  )
}
