export default function Summary({ summary }) {
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const isPos = (n) => parseFloat(n) >= 0

  return (
    <div className="summary">
      <div className="summary-card">
        <span className="summary-label">Total Value</span>
        <span className="summary-value">{fmt(summary.total_value)}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Today's Gain</span>
        <span className={`summary-value ${isPos(summary.total_days_gain) ? 'green' : 'red'}`}>
          {isPos(summary.total_days_gain) ? '+' : ''}{fmt(summary.total_days_gain)}
        </span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Total Gain/Loss</span>
        <span className={`summary-value ${isPos(summary.total_gain) ? 'green' : 'red'}`}>
          {isPos(summary.total_gain) ? '+' : ''}{fmt(summary.total_gain)}
        </span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Positions</span>
        <span className="summary-value">{summary.position_count}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Winners / Losers</span>
        <span className="summary-value">
          <span className="green">{summary.winners}</span>
          <span className="muted" style={{fontSize:'14px'}}> / </span>
          <span className="red">{summary.losers}</span>
        </span>
      </div>
    </div>
  )
}
