export default function SellRecommendationsModal({ analysis, error, loading, analyzing, onRunFullAnalysis, onClose }) {
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
              AI Sell Recommendation
            </span>
          </div>
          <button className="analysis-close" onClick={onClose} style={{fontSize:'22px'}}>×</button>
        </div>

        {analyzing ? (
          <div style={{textAlign:'center', padding:'40px 0'}}>
            <div className="spinner" style={{margin:'0 auto 16px'}} />
            <div style={{fontSize:'14px', color:'var(--text2)'}}>Running full portfolio analysis…</div>
            <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'6px'}}>This usually takes 20–30 seconds</div>
          </div>
        ) : loading ? (
          <div style={{textAlign:'center', padding:'40px 0'}}>
            <div className="spinner" style={{margin:'0 auto 16px'}} />
            <div style={{fontSize:'14px', color:'var(--text2)'}}>Getting your sell recommendation…</div>
            <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'6px'}}>This usually takes 10–15 seconds</div>
          </div>
        ) : error ? (
          <div style={{textAlign:'center', padding:'30px 0'}}>
            <div style={{fontSize:'28px', marginBottom:'12px'}}>⚠️</div>
            <div style={{fontSize:'14px', color:'var(--text)', lineHeight:'1.6'}}>{error}</div>
          </div>
        ) : (
          <div style={{
            color:'var(--text)',
            lineHeight:'1.8',
            fontSize:'13px',
            whiteSpace:'pre-wrap'
          }}>
            {analysis}
          </div>
        )}

        <div style={{
          marginTop:'24px',
          paddingTop:'16px',
          borderTop:'1px solid var(--border)',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          flexWrap:'wrap',
          gap:'10px'
        }}>
          <span style={{fontSize:'11px', color:'var(--text3)'}}>
            Not financial advice — for informational purposes only
          </span>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            {!loading && !analyzing && (
              <button
                className="btn-ai"
                onClick={onRunFullAnalysis}
                style={{fontSize:'12px', padding:'8px 14px'}}
              >
                ✦ See complete analysis
              </button>
            )}
            {!analyzing && (
              <button className="btn-save" onClick={onClose}>Got it</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
