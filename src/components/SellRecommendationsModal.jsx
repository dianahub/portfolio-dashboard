export default function SellRecommendationsModal({ analysis, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{width:'620px', maxHeight:'88vh', overflowY:'auto'}}>
        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          marginBottom:'20px',
          paddingBottom:'16px',
          borderBottom:'1px solid var(--border)'
        }}>
          <div>
            <h2 style={{
              fontFamily:'var(--font-display)',
              fontSize:'22px',
              fontWeight:'800',
              color:'var(--text)',
              marginBottom:'4px'
            }}>
              Sell It? 🤔
            </h2>
            <span style={{
              fontSize:'11px',
              color:'var(--text3)',
              textTransform:'uppercase',
              letterSpacing:'0.1em'
            }}>
              AI Sell Recommendations — Login Analysis
            </span>
          </div>
          <button className="analysis-close" onClick={onClose} style={{fontSize:'22px'}}>×</button>
        </div>

        <div style={{
          color:'var(--text)',
          lineHeight:'1.8',
          fontSize:'13px',
          whiteSpace:'pre-wrap'
        }}>
          {analysis}
        </div>

        <div style={{
          marginTop:'24px',
          paddingTop:'16px',
          borderTop:'1px solid var(--border)',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center'
        }}>
          <span style={{fontSize:'11px', color:'var(--text3)'}}>
            Not financial advice — for informational purposes only
          </span>
          <button className="btn-save" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}