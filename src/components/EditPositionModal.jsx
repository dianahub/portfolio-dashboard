import { useState } from 'react'

export default function EditPositionModal({ position, onSave, onClose }) {
  const [form, setForm] = useState({ ...position })

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(position.id, form)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Edit — {position.symbol}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Avg Cost (Price Paid)</label>
              <input type="number" step="0.000001" value={form.price_paid} onChange={e => set('price_paid', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Price</label>
              <input type="number" step="0.000001" value={form.last_price} onChange={e => set('last_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Current Value</label>
              <input type="number" step="0.01" value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Today's Change $</label>
              <input type="number" step="0.01" value={form.days_gain_dollar} onChange={e => set('days_gain_dollar', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Today's Change %</label>
              <input type="number" step="0.01" value={form.change_percent} onChange={e => set('change_percent', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Total Gain $</label>
              <input type="number" step="0.01" value={form.total_gain_dollar} onChange={e => set('total_gain_dollar', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Total Gain %</label>
              <input type="number" step="0.01" value={form.total_gain_percent} onChange={e => set('total_gain_percent', e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}