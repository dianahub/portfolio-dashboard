export default function AIAnalysis({ analysis, onClose }) {
  return (
    <div className="analysis-box">
      <div className="analysis-header">
        <span className="analysis-title">✦ AI Portfolio Analysis</span>
        <button className="analysis-close" onClick={onClose}>✕ Close</button>
      </div>
      <div className="analysis-text">{analysis}</div>
    </div>
  )
}
