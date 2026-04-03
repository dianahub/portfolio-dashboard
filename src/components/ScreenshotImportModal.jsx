import { useState } from 'react'
import API_BASE_URL from '../config/api'   // ← added

export default function ScreenshotImportModal({ token, onImported, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch(`${API_BASE_URL}/portfolio/import-screenshot`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  function handleDone() {
    onImported()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{width:'560px', maxHeight:'90vh', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <div>
            <h2 style={{marginBottom:'4px'}}>Import from Screenshot</h2>
            <span style={{fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>
              Upload a broker screenshot — AI will read it automatically
            </span>
          </div>
          <button className="analysis-close" onClick={onClose} style={{fontSize:'22px'}}>×</button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{textAlign:'center', padding:'40px 0'}}>
            <div className="spinner" style={{margin:'0 auto 16px'}} />
            <div style={{fontSize:'14px', color:'var(--text2)'}}>Reading screenshot with AI...</div>
            <div style={{fontSize:'12px', color:'var(--text3)', marginTop:'6px'}}>This usually takes 10–20 seconds</div>
          </div>
        )}

        {/* Upload area */}
        {!result && !loading && (
          <>
            <label style={{
              display:'block',
              border: `2px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius:'10px',
              padding:'32px',
              textAlign:'center',
              cursor:'pointer',
              transition:'all 0.2s',
              background: file ? 'var(--accent-dim)' : 'transparent'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{display:'none'}}
              />
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{maxWidth:'100%', maxHeight:'300px', borderRadius:'6px', marginBottom:'12px'}}
                />
              ) : (
                <div style={{color:'var(--text3)', fontSize:'13px'}}>
                  <div style={{fontSize:'32px', marginBottom:'8px'}}>📸</div>
                  <div>Click to upload a screenshot</div>
                  <div style={{fontSize:'11px', marginTop:'4px'}}>PNG, JPG, WEBP up to 10MB</div>
                </div>
              )}
              {file && (
                <div style={{fontSize:'12px', color:'var(--accent)', marginTop:'8px'}}>
                  {file.name}
                </div>
              )}
            </label>

            {error && (
              <div className="error" style={{marginTop:'12px'}}>{error}</div>
            )}

            <div style={{
              marginTop:'12px',
              padding:'12px',
              background:'var(--bg3)',
              borderRadius:'8px',
              fontSize:'11px',
              color:'var(--text3)'
            }}>
              💡 Works best with screenshots from Fidelity, Schwab, TD Ameritrade, Robinhood, or similar brokers. Make sure the positions table is visible and readable.
            </div>
          </>
        )}

        {/* Success result */}
        {result && (
          <div style={{
            background:'var(--green-dim)',
            border:'1px solid var(--green)',
            borderRadius:'8px',
            padding:'20px',
            textAlign:'center'
          }}>
            <div style={{fontSize:'32px', marginBottom:'8px'}}>✅</div>
            <div style={{color:'var(--green)', fontSize:'16px', fontWeight:'500', marginBottom:'8px'}}>
              {result.message}
            </div>
            <div style={{fontSize:'12px', color:'var(--text2)'}}>
              Your portfolio has been updated with the imported positions.
            </div>
          </div>
        )}

        <div className="modal-actions" style={{marginTop:'20px'}}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          {!result ? (
            <button
              className="btn-save"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? '⟳ Reading screenshot...' : '✦ Import with AI'}
            </button>
          ) : (
            <button className="btn-save" onClick={handleDone}>
              View Portfolio
            </button>
          )}
        </div>
      </div>
    </div>
  )
}