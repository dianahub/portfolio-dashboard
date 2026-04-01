import { useState } from 'react'

export default function PositionTable({ positions, onDelete, onRefresh, onEdit, onAnalyze }) {
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  const fmtPct = (n) => `${parseFloat(n) >= 0 ? '+' : ''}${parseFloat(n).toFixed(2)}%`
  const isPos = (n) => parseFloat(n) >= 0

  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...positions].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey]
    const bv = b[sortKey]
    const an = parseFloat(av)
    const bn = parseFloat(bv)
    let cmp
    if (!isNaN(an) && !isNaN(bn)) {
      cmp = an - bn
    } else {
      cmp = String(av ?? '').localeCompare(String(bv ?? ''))
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortTh({ label, field }) {
    const active = sortKey === field
    const arrow = active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
    return (
      <th
        onClick={() => handleSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        {label}<span style={{ opacity: active ? 1 : 0.3, fontSize: '10px' }}>{arrow || ' ▲'}</span>
      </th>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="empty">
        No positions yet. Add them manually or navigate to your brokerage page to have them imported automatically.
      </div>
    )
  }

  return (
    <div>
      <div className="table-header">
        <span className="table-title">{positions.length} Positions</span>
        <button className="refresh-btn" onClick={onRefresh}>↻ Refresh</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortTh label="Symbol" field="symbol" />
              <SortTh label="Qty" field="quantity" />
              <SortTh label="Avg Cost" field="price_paid" />
              <SortTh label="Last" field="last_price" />
              <SortTh label="Today" field="days_gain_dollar" />
              <SortTh label="Today %" field="change_percent" />
              <SortTh label="Value" field="value" />
              <SortTh label="Total G/L" field="total_gain_dollar" />
              <SortTh label="Total %" field="total_gain_percent" />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="symbol-cell">
                    <span className="symbol">{p.symbol}</span>
                    <span className={`asset-badge badge-${p.asset_type || 'stock'}`}>
                      {p.asset_type || 'stock'}
                      {p.option_type ? ` ${p.option_type}` : ''}
                    </span>
                    {p.asset_type === 'option' && (p.strike_price || p.expiration_date) && (
                      <span className="option-detail">
                        {p.strike_price ? `$${parseFloat(p.strike_price).toFixed(2)}` : ''}
                        {p.strike_price && p.expiration_date ? ' · ' : ''}
                        {p.expiration_date ? new Date(p.expiration_date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' }) : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="muted">{parseFloat(p.quantity).toLocaleString()}</td>
                <td className="muted">{fmt(p.price_paid)}</td>
                <td>{fmt(p.last_price)}</td>
                <td className={isPos(p.days_gain_dollar) ? 'green' : 'red'}>
                  {isPos(p.days_gain_dollar) ? '+' : ''}{fmt(p.days_gain_dollar)}
                </td>
                <td className={isPos(p.change_percent) ? 'green' : 'red'}>
                  {fmtPct(p.change_percent)}
                </td>
                <td>{fmt(p.value)}</td>
                <td className={isPos(p.total_gain_dollar) ? 'green' : 'red'}>
                  {isPos(p.total_gain_dollar) ? '+' : ''}{fmt(p.total_gain_dollar)}
                </td>
                <td className={isPos(p.total_gain_percent) ? 'green' : 'red'}>
                  {fmtPct(p.total_gain_percent)}
                </td>
                <td>
                  <div style={{display:'flex', gap:'6px', justifyContent:'flex-end'}}>
                    <button className="analyze-btn" onClick={() => onAnalyze(p)} title="AI Analysis">✦</button>
                    <button className="edit-btn" onClick={() => onEdit(p)} title="Edit position">✎</button>
                    <button className="delete-btn" onClick={() => onDelete(p.id)} title="Remove position">×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
