import { useState } from 'react'

const EMPTY = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }
const input =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

export default function SearchFilters({ onSearch, onReset }) {
  const [filters, setFilters] = useState(EMPTY)
  const [error, setError] = useState('')

  const update = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })

  function submit(e) {
    e.preventDefault()
    const { minPrice, maxPrice } = filters
    if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
      setError('Minimum price cannot be higher than maximum price.')
      return
    }
    setError('')
    onSearch(filters)
  }

  function reset() {
    setFilters(EMPTY)
    setError('')
    onReset()
  }

  const field = (label, name, type = 'text', extra = {}) => (
    <div>
      <label htmlFor={`f-${name}`} className="block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <input id={`f-${name}`} name={name} type={type} value={filters[name]} onChange={update} className={input} {...extra} />
    </div>
  )

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {field('Make', 'make')}
        {field('Model', 'model')}
        {field('Category', 'category')}
        {field('Min price', 'minPrice', 'number', { min: 0 })}
        {field('Max price', 'maxPrice', 'number', { min: 0 })}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Search</button>
        <button type="button" onClick={reset} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Reset</button>
      </div>
    </form>
  )
}
