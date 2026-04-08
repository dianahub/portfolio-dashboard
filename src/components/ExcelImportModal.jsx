import { useState } from 'react'
import * as XLSX from 'xlsx'
import API_BASE_URL from '../config/api'

export default function ExcelImportModal({ token, onImported, onClose }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)   // parsed rows before import
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState(null)

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setError(null)
    setPreview(null)
    setDone(false)
    setFile(f)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        // raw: true keeps numbers as numbers; header: 1 gives array-of-arrays
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

        // Find the first data row: skip header rows (rows 1-3 are title/subtitle/headers)
        // Data rows start at index 3 (row 4 in Excel, 0-indexed = 3)
        // Columns: 0=# 1=Ticker 2=Company 3=Shares 4=PriceAcquired 5=CurrentPrice
        //          6=CostBasis 7=CurrentValue 8=GainLossDollar 9=GainLossPct
        const parsed = []
        for (let i = 3; i < rows.length; i++) {
          const row = rows[i]
          const ticker = row[1]
          // Stop at totals row or empty rows
          if (!ticker || typeof ticker !== 'string' || ticker.trim() === '' ||
              ticker.toUpperCase().includes('TOTAL')) break

          const qty      = parseFloat(row[3])
          const pricePd  = parseFloat(row[4])
          const lastPr   = parseFloat(row[5])
          const value    = parseFloat(row[7])
          const glDollar = parseFloat(row[8])
          const glPct    = parseFloat(row[9])

          if (isNaN(qty) || isNaN(pricePd)) continue

          parsed.push({
            symbol:             ticker.trim().toUpperCase(),
            asset_type:         'stock',
            quantity:           qty,
            price_paid:         pricePd,
            last_price:         isNaN(lastPr)   ? pricePd : lastPr,
            value:              isNaN(value)    ? qty * lastPr : value,
            total_gain_dollar:  isNaN(glDollar) ? 0 : glDollar,
            total_gain_percent: isNaN(glPct)    ? 0 : glPct,
            days_gain_dollar:   0,
            change_percent:     0,
          })
        }

        if (parsed.length === 0) {
          setError('No valid positions found in the file. Make sure you\'re using the exported stock_portfolio.xlsx format.')
          return
        }

        setPreview(parsed)
      } catch (err) {
        setError(`Could not parse file: ${err.message}`)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  async function handleImport() {
    if (!preview?.length) return
    setLoading(true)
    setError(null)

    try {
      // Delete all existing positions
      const existingRes = await fetch(`${API_BASE_URL}/positions`, { headers })
      const existingData = existingRes.ok ? await existingRes.json() : { positions: [] }
      await Promise.allSettled(
        (existingData.positions || []).map(p =>
          fetch(`${API_BASE_URL}/positions/${p.id}`, { method: 'DELETE', headers })
        )
      )

      // Create new positions from Excel data
      await Promise.allSettled(
        preview.map(pos =>
          fetch(`${API_BASE_URL}/positions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(pos),
          })
        )
      )

      setDone(true)
    } catch (e) {
      setError(`Import failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleDone() {
    onImported()
    onClose()
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(n)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ marginBottom: '4px' }}>Import from Excel</h2>
            <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Replaces all current positions with data from the spreadsheet
            </span>
          </div>
          <button className="analysis-close" onClick={onClose} style={{ fontSize: '22px' }}>×</button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Importing positions...</div>
          </div>
        )}

        {/* Success */}
        {done && (
          <div style={{
            background: 'var(--green-dim)', border: '1px solid var(--green)',
            borderRadius: '8px', padding: '20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ color: 'var(--green)', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              {preview.length} positions imported successfully
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
              Your portfolio has been replaced with the Excel data.
            </div>
          </div>
        )}

        {/* Upload + preview */}
        {!loading && !done && (
          <>
            {/* Drop zone */}
            <label style={{
              display: 'block',
              border: `2px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: '10px',
              padding: '28px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: file ? 'var(--accent-dim)' : 'transparent',
              marginBottom: '16px',
            }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <div style={{ color: 'var(--text3)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                {file
                  ? <div style={{ color: 'var(--accent)', fontWeight: 500 }}>{file.name}</div>
                  : <>
                      <div>Click to upload an Excel file</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>.xlsx or .xls</div>
                    </>
                }
              </div>
            </label>

            {error && <div className="error" style={{ marginBottom: '12px' }}>{error}</div>}

            {/* Preview table */}
            {preview && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
                  Found <strong style={{ color: 'var(--text1)' }}>{preview.length} positions</strong> — existing positions will be erased on import.
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg3)', position: 'sticky', top: 0 }}>
                        {['Symbol', 'Qty', 'Price Paid', 'Current', 'Value', 'G/L $', 'G/L %'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Symbol' ? 'left' : 'right',
                            color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((p, i) => {
                        const isPos = p.total_gain_dollar >= 0
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border1)' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.symbol}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)' }}>
                              {p.quantity.toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)' }}>
                              {fmt(p.price_paid)}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                              {fmt(p.last_price)}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                              {fmt(p.value)}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right',
                              color: isPos ? 'var(--green)' : 'var(--red)' }}>
                              {isPos ? '+' : ''}{fmt(p.total_gain_dollar)}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right',
                              color: isPos ? 'var(--green)' : 'var(--red)' }}>
                              {isPos ? '+' : ''}{p.total_gain_percent.toFixed(2)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Required columns reference — shown before first upload and after preview */}
            <div style={{
              marginTop: '12px', padding: '14px 16px', background: 'var(--bg3)',
              borderRadius: '8px', border: '1px solid var(--border1)',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                📋 Required Column Layout (Row 4 onward)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px' }}>
                {[
                  ['Column B', 'Ticker symbol', true],
                  ['Column C', 'Company name', false],
                  ['Column D', 'Number of shares', true],
                  ['Column E', 'Price paid / cost basis', true],
                  ['Column F', 'Current price', true],
                  ['Column G', 'Cost basis total', false],
                  ['Column H', 'Current value', true],
                  ['Column I', 'Gain / Loss ($)', true],
                  ['Column J', 'Gain / Loss (%)', true],
                ].map(([col, desc, required]) => (
                  <div key={col} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '11px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)',
                      minWidth: '72px', flexShrink: 0 }}>{col}</span>
                    <span style={{ color: 'var(--text2)' }}>{desc}</span>
                    {required
                      ? <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: '10px' }}>*</span>
                      : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>optional</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text3)', borderTop: '1px solid var(--border1)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>*</span> required &nbsp;·&nbsp;
                Rows 1–3 are treated as headers and skipped &nbsp;·&nbsp;
                A "TOTAL" row at the bottom is ignored automatically
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          {done ? (
            <button className="btn-save" onClick={handleDone}>View Portfolio</button>
          ) : (
            <button
              className="btn-save"
              onClick={handleImport}
              disabled={!preview || loading}
            >
              {loading ? '⟳ Importing...' : `↑ Import ${preview ? preview.length + ' Positions' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
