export default function PositionTable({ positions, onDelete, onRefresh, onEdit, onAnalyze }) {
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  const fmtPct = (n) => `${parseFloat(n) >= 0 ? '+' : ''}${parseFloat(n).toFixed(2)}%`
  const isPos = (n) => parseFloat(n) >= 0

  if (positions.length === 0) {
    return <div className="empty">No positions found. Add one to get started.</div>
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
              <th>Symbol</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>Last</th>
              <th>Today</th>
              <th>Today %</th>
              <th>Value</th>
              <th>Total G/L</th>
              <th>Total %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="symbol-cell">
                    <span className="symbol">{p.symbol}</span>
                    <span className={`asset-badge badge-${p.asset_type || 'stock'}`}>
                      {p.asset_type || 'stock'}
                      {p.option_type ? ` ${p.option_type}` : ''}
                    </span>
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