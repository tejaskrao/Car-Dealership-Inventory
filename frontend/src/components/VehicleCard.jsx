import { formatPrice } from '../lib.js'

const ghost = 'rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50'

export default function VehicleCard({ vehicle, isAdmin, onPurchase, onEdit, onDelete, onRestock }) {
  const soldOut = vehicle.quantity === 0
  const low = vehicle.quantity > 0 && vehicle.quantity <= 3

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{`${vehicle.make} ${vehicle.model}`}</h3>
          <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{vehicle.category}</span>
        </div>
        <p className="text-lg font-bold text-slate-900">{formatPrice(vehicle.price)}</p>
      </div>

      <p className={`mt-4 text-sm ${soldOut ? 'font-semibold text-red-600' : low ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
        {soldOut ? 'Out of stock' : low ? `Only ${vehicle.quantity} left` : `${vehicle.quantity} in stock`}
        {low && <span className="sr-only">{` (${vehicle.quantity} in stock)`}</span>}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => onPurchase(vehicle)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Purchase
        </button>
        {isAdmin && (
          <div className="flex gap-1.5">
            <button type="button" className={ghost} onClick={() => onEdit(vehicle)}>Edit</button>
            <button type="button" className={ghost} onClick={() => onRestock(vehicle)}>Restock</button>
            <button type="button" className={`${ghost} !text-red-600 !ring-red-200 hover:!bg-red-50`} onClick={() => onDelete(vehicle)}>Delete</button>
          </div>
        )}
      </div>
    </article>
  )
}
