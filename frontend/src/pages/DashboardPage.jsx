import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api/vehicles.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import SearchFilters from '../components/SearchFilters.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import VehicleForm from '../components/VehicleForm.jsx'

const replaceById = (list, updated) => list.map((v) => (v.id === updated.id ? updated : v))
const btn = 'rounded-lg px-4 py-2 text-sm font-semibold'

export default function DashboardPage() {
  const { token, isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [dialog, setDialog] = useState(null) // { kind: 'form'|'delete'|'restock', vehicle? }
  const [dialogError, setDialogError] = useState('')
  const [busy, setBusy] = useState(false)
  const [restockQty, setRestockQty] = useState('')
  const lastFilters = useRef(null)
  const timer = useRef(null)

  const flash = useCallback((type, text) => {
    setNotice({ type, text })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setNotice(null), 4000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const load = useCallback(
    async (filters) => {
      lastFilters.current = filters
      setStatus('loading')
      try {
        setVehicles(filters ? await api.searchVehicles(token, filters) : await api.listVehicles(token))
        setStatus('ready')
      } catch (err) {
        setLoadError(err.message)
        setStatus('error')
      }
    },
    [token],
  )

  useEffect(() => {
    load(null)
  }, [load])

  const closeDialog = () => {
    setDialog(null)
    setDialogError('')
    setRestockQty('')
  }

  async function purchase(vehicle) {
    try {
      const updated = await api.purchaseVehicle(token, vehicle.id, 1)
      setVehicles((list) => replaceById(list, updated))
      flash('success', `Purchased ${vehicle.make} ${vehicle.model}.`)
    } catch (err) {
      flash('error', err.message)
    }
  }

  async function run(action) {
    setBusy(true)
    setDialogError('')
    try {
      await action()
      closeDialog()
    } catch (err) {
      setDialogError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const saveVehicle = (data) =>
    run(async () => {
      if (dialog.vehicle) {
        const updated = await api.updateVehicle(token, dialog.vehicle.id, data)
        setVehicles((list) => replaceById(list, updated))
        flash('success', `Saved ${updated.make} ${updated.model}.`)
      } else {
        const created = await api.createVehicle(token, data)
        setVehicles((list) => [...list, created])
        flash('success', `Added ${created.make} ${created.model}.`)
      }
    })

  const confirmDelete = () =>
    run(async () => {
      const { vehicle } = dialog
      await api.deleteVehicle(token, vehicle.id)
      setVehicles((list) => list.filter((v) => v.id !== vehicle.id))
      flash('success', `Deleted ${vehicle.make} ${vehicle.model}.`)
    })

  function submitRestock(e) {
    e.preventDefault()
    if (!/^\d+$/.test(restockQty.trim()) || Number(restockQty) < 1) {
      setDialogError('Enter a whole number of at least 1.')
      return
    }
    run(async () => {
      const updated = await api.restockVehicle(token, dialog.vehicle.id, Number(restockQty))
      setVehicles((list) => replaceById(list, updated))
      flash('success', `Restocked ${updated.make} ${updated.model}: ${updated.quantity} in stock.`)
    })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">Browse vehicles, check stock and make a purchase.</p>
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setDialog({ kind: 'form' })} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
            Add vehicle
          </button>
        )}
      </div>

      <SearchFilters onSearch={(f) => load(f)} onReset={() => load(null)} />

      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-sm ring-1 ${notice.type === 'error' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}
        >
          {notice.text}
        </div>
      )}

      {status === 'loading' && <p className="py-12 text-center text-slate-500">Loading inventory…</p>}

      {status === 'error' && (
        <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700 ring-1 ring-red-200">
          <p>{loadError}</p>
          <button type="button" onClick={() => load(lastFilters.current)} className={`${btn} mt-3 bg-white ring-1 ring-red-300`}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && vehicles.length === 0 && (
        <p className="rounded-xl bg-white py-12 text-center text-slate-500 ring-1 ring-slate-200">No vehicles found.</p>
      )}

      {status === 'ready' && vehicles.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Vehicles">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              isAdmin={isAdmin}
              onPurchase={purchase}
              onEdit={(vehicle) => setDialog({ kind: 'form', vehicle })}
              onDelete={(vehicle) => setDialog({ kind: 'delete', vehicle })}
              onRestock={(vehicle) => setDialog({ kind: 'restock', vehicle })}
            />
          ))}
        </section>
      )}

      {dialog?.kind === 'form' && (
        <Modal title={dialog.vehicle ? 'Edit vehicle' : 'Add vehicle'} onClose={closeDialog}>
          <VehicleForm vehicle={dialog.vehicle} onSubmit={saveVehicle} onCancel={closeDialog} error={dialogError} busy={busy} />
        </Modal>
      )}

      {dialog?.kind === 'delete' && (
        <Modal title={`Delete ${dialog.vehicle.make} ${dialog.vehicle.model}?`} onClose={closeDialog}>
          <p className="text-sm text-slate-600">This removes the vehicle from the inventory permanently.</p>
          {dialogError && <p role="alert" className="mt-3 text-sm text-red-700">{dialogError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={closeDialog} className={`${btn} ring-1 ring-slate-300 text-slate-700`}>Cancel</button>
            <button type="button" disabled={busy} onClick={confirmDelete} className={`${btn} bg-red-600 text-white hover:bg-red-700 disabled:opacity-60`}>Delete</button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'restock' && (
        <Modal title={`Restock ${dialog.vehicle.make} ${dialog.vehicle.model}`} onClose={closeDialog}>
          <form onSubmit={submitRestock} noValidate>
            <label htmlFor="restock-qty" className="block text-sm font-medium text-slate-700">Units to add</label>
            <input
              id="restock-qty"
              type="number"
              min="1"
              step="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {dialogError && <p role="alert" className="mt-3 text-sm text-red-700">{dialogError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeDialog} className={`${btn} ring-1 ring-slate-300 text-slate-700`}>Cancel</button>
              <button type="submit" disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60`}>Restock</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  )
}
