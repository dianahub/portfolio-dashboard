import { useState } from 'react'

const defaults = {
  symbol: '', asset_type: 'stock', quantity: '', price_paid: '',
  last_price: '', change_dollar: '0', change_percent: '0',
  days_gain_dollar: '0', total_gain_dollar: '0', total_gain_percent: '0',
  value: '', option_type: '', strike_price: '', expiration_date: '',
  underlying_symbol: ''
}

export default function AddPositionModal({ onAdd, onClose }) {
  const [form, setForm] = useState(defaults)
  const [showOptions, setShowOptions] = useState(false)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
      console.log('Submitting payload:', payload)  // ← add this
    // auto-calculate value if not set
    if (!payload.value && payload.last_price && payload.quantity) {
      payload.value = (parseFloat(payload.last_price) * parseFloat(payload.quantity)).toFixed(2)
    }
    // auto-calculate total gain if not set
    if (!payload.total_gain_dollar && payload.price_paid && payload.quantity && payload.last_price) {
      payload.total_gain_dollar = ((parseFloat(payload.last_price) - parseFloat(payload.price_paid)) * parseFloat(payload.quantity)).toFixed(2)
    }
    onAdd(payload)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add Position</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Symbol *</label>
              <input value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="AAPL" required />
            </div>
            <div className="form-group">
              <label>Asset Type</label>
              <select value={form.asset_type} onChange={e => { set('asset_type', e.target.value); setShowOptions(e.target.value === 'option') }}>
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="option">Option</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="100" required />
            </div>
            <div className="form-group">
              <label>Avg Cost (Price Paid) *</label>
              <input type="number" step="0.000001" value={form.price_paid} onChange={e => set('price_paid', e.target.value)} placeholder="150.00" required />
            </div>
            <div className="form-group">
              <label>Last Price *</label>
              <input type="number" step="0.000001" value={form.last_price} onChange={e => set('last_price', e.target.value)} placeholder="165.00" required />
            </div>
            <div className="form-group">
              <label>Current Value</label>
              <input type="number" step="0.01" value={form.value} onChange={e => set('value', e.target.value)} placeholder="Auto-calculated" />
            </div>
            <div className="form-group">
              <label>Today's Change $</label>
              <input type="number" step="0.01" value={form.days_gain_dollar} onChange={e => set('days_gain_dollar', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Today's Change %</label>
              <input type="number" step="0.01" value={form.change_percent} onChange={e => set('change_percent', e.target.value)} placeholder="0.00" />
            </div>

            {showOptions && <>
              <div className="form-group">
                <label>Option Type</label>
                <select value={form.option_type} onChange={e => set('option_type', e.target.value)}>
                  <option value="">Select</option>
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>
              <div className="form-group">
                <label>Underlying Symbol</label>
                <input value={form.underlying_symbol} onChange={e => set('underlying_symbol', e.target.value.toUpperCase())} placeholder="SPY" />
              </div>
              <div className="form-group">
                <label>Strike Price</label>
                <input type="number" step="0.01" value={form.strike_price} onChange={e => set('strike_price', e.target.value)} placeholder="500.00" />
              </div>
              <div className="form-group">
                <label>Expiration Date</label>
                <input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} />
              </div>
            </>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Add Position</button>
          </div>
        </form>
      </div>
    </div>
  )
}
