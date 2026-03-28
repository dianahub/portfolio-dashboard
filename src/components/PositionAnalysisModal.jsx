import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'   // ← added (adjust only if your folder structure is different)

export default function PositionAnalysisModal({ position, token, onClose }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/positions/${position.id}/analyze`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const details = {
            message: data.message || 'Request failed',
            status: data.status,
            raw: data.raw,
          }
          setAnalysis(`Analysis failed (${res.status}): ${JSON.stringify(details, null, 2)}`)
          return
        }
        setAnalysis(data.analysis)
      } catch (e) {
        setAnalysis('Analysis failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [position.id, token])   // ← small bonus: added dependencies so it re-runs if they change

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{width:'580px', maxHeight:'85vh', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <div>
            <h2 style={{marginBottom:'4px'}}>{position.symbol}</h2>
            <span style={{fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>
              AI Position Analysis
            </span>
          </div>
          <button className="analysis-close" onClick={onClose} style={{fontSize:'22px'}}>×</button>
        </div>

        {loading ? (
          <div className="loading" style={{padding:'40px'}}>
            <div className="spinner" />
            <span>Analyzing {position.symbol}...</span>
          </div>
        ) : (
          <div className="analysis-text" style={{color:'var(--text)', lineHeight:'1.8', fontSize:'13px', whiteSpace:'pre-wrap'}}>
            {analysis}
          </div>
        )}

        <div className="modal-actions" style={{marginTop:'24px'}}>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}