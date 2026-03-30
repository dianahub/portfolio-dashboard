import { useState, useEffect, useRef } from 'react'
import PositionTable from './components/PositionTable'
import AddPositionModal from './components/AddPositionModal'
import Summary from './components/Summary'
import AIAnalysis from './components/AIAnalysis'
import EditPositionModal from './components/EditPositionModal'
import PositionAnalysisModal from './components/PositionAnalysisModal'
import LoginScreen from './components/LoginScreen'
import SellRecommendationsModal from './components/SellRecommendationsModal'
import ScreenshotImportModal from './components/ScreenshotImportModal'
import API_BASE_URL from './config/api'   // ← added (perfect path from App.jsx)

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('tf_token') || null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('tf_user') || 'null'))
  const [positions, setPositions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [editingPosition, setEditingPosition] = useState(null)
  const [analyzingPosition, setAnalyzingPosition] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sellRecommendations, setSellRecommendations] = useState(null)
  const [loadingSellRecs, setLoadingSellRecs] = useState(false)
  const [showScreenshotImport, setShowScreenshotImport] = useState(false)

  const didRefreshStocksForToken = useRef(null)

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const hasStockPositions = positions.some((p) => !p.asset_type || p.asset_type === 'stock' || p.asset_type === 'etf')

  function handleLogin(newToken, newUser) {
    localStorage.setItem('tf_token', newToken)
    localStorage.setItem('tf_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function handleLogout() {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    setToken(null)
    setUser(null)
  }

  async function fetchPositions() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/positions`, { headers })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setError(`API error ${res.status}: ${errData.message || 'Failed to fetch positions'}`)
        return
      }
      const data = await res.json()
      setPositions(data.positions || [])
      setSummary(data.summary || null)
    } catch (e) {
      console.error('fetchPositions error:', e)
      setError(`Could not connect to API: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSellRecommendations() {
    setLoadingSellRecs(true)
    try {
      const res = await fetch(`${API_BASE_URL}/positions/sell-recommendations`, {
        method: 'POST',
        headers
      })
      if (!res.ok) {
        console.error('Sell recommendations error:', res.status)
        return
      }
      const data = await res.json()
      setSellRecommendations(data.analysis)
    } catch (e) {
      console.error('Sell recommendations failed:', e.message)
    } finally {
      setLoadingSellRecs(false)
    }
  }

  async function refreshCrypto() {
    try {
      const res = await fetch(`${API_BASE_URL}/prices/refresh-crypto`, { method: 'POST', headers })
      if (res.ok) {
        const data = await res.json()
        console.log('Crypto updated:', data)
        fetchPositions()
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('Crypto refresh error:', res.status, errData)
      }
    } catch (e) {
      console.error('Crypto refresh failed:', e.message)
    }
  }

  async function refreshStocks() {
    setRefreshing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/prices/refresh-stocks`, { method: 'POST', headers })
      if (res.ok) {
        const data = await res.json()
        console.log('Stocks updated:', data)
        fetchPositions()
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('Stock refresh error:', res.status, errData)
      }
    } catch (e) {
      console.error('Stock refresh failed:', e.message)
    } finally {
      setRefreshing(false)
    }
  }

  async function deletePosition(id) {
    if (!confirm('Remove this position?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/positions/${id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        setError(`Failed to delete: ${res.status}`)
        return
      }
      fetchPositions()
    } catch (e) {
      setError(`Delete failed: ${e.message}`)
    }
  }

  async function addPosition(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/positions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.message || `Error: ${res.status}`)
        return
      }
      setShowAdd(false)
      fetchPositions()
    } catch (e) {
      setError(`Failed to add position: ${e.message}`)
    }
  }

  async function savePosition(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/positions/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.message || `Error: ${res.status}`)
        return
      }
      setEditingPosition(null)
      fetchPositions()
    } catch (e) {
      setError(`Failed to save position: ${e.message}`)
    }
  }

  async function runAnalysis() {
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch(`${API_BASE_URL}/positions/analyze`, { method: 'POST', headers })
      const data = await res.json()
      setAnalysis(data.analysis)
    } catch (e) {
      setAnalysis('Analysis failed. Check your API key.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Fetch positions when token is available
  useEffect(() => {
    if (token) fetchPositions()
  }, [token])

  // Auto-import positions pushed by the Sell it? Chrome extension
  useEffect(() => {
    const handler = async (e) => {
      if (!token) return  // must be logged in
      const incoming = e.detail?.positions
      if (!incoming?.length) return

      // Map extension position shape → API shape
      const mapped = incoming.map(p => ({
        symbol:             p.symbol,
        asset_type:         (p.asset_type || 'EQUITY').toLowerCase(),
        quantity:           p.quantity,
        price_paid:         p.price_paid,
        last_price:         p.last_price,
        value:              p.value,
        total_gain_dollar:  p.total_gain_dollar,
        total_gain_percent: p.total_gain_percent,
        days_gain_dollar:   p.days_gain_dollar,
      }))

      // POST all positions in parallel, then refresh once
      await Promise.allSettled(
        mapped.map(pos =>
          fetch(`${API_BASE_URL}/positions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(pos),
          })
        )
      )
      fetchPositions()
    }

    window.addEventListener('sellit:import-positions', handler)
    return () => window.removeEventListener('sellit:import-positions', handler)
  }, [token])

  // Auto-refresh crypto every 5 minutes (only after positions loaded)
  useEffect(() => {
    if (!token || positions.length === 0) return
    refreshCrypto()
    const interval = setInterval(refreshCrypto, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token, positions.length])

  // Refresh stocks once on login (only after positions loaded)
  // Disabled by default due to Alpha Vantage API limits with many positions
  // useEffect(() => {
  //   if (!token || positions.length === 0) return
  //   refreshStocks()
  // }, [token, positions.length])

  useEffect(() => {
    if (!token || positions.length === 0) return
    if (!hasStockPositions) return
    if (didRefreshStocksForToken.current === token) return
    didRefreshStocksForToken.current = token
    refreshStocks()
  }, [token, positions.length, hasStockPositions])

  // Fetch sell recommendations 3 seconds after login (only after positions loaded)
  useEffect(() => {
    if (!token || positions.length === 0) return
    const timer = setTimeout(() => {
      fetchSellRecommendations()
    }, 3000)
    return () => clearTimeout(timer)
  }, [token, positions.length])

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">SI</div>
          <div>
            <h1>Sell It?</h1>
            <span className="subtitle">Portfolio Analyzer</span>
          </div>
        </div>
        <div className="header-actions">
          {loadingSellRecs && (
            <span style={{fontSize:'11px', color:'var(--accent)', marginRight:'8px'}}>
              ⟳ Analyzing portfolio...
            </span>
          )}
          <span style={{fontSize:'12px', color:'var(--text3)', marginRight:'8px'}}>
           {user?.name}
  {user?.logins_remaining !== null && user?.logins_remaining !== undefined && (
    <span style={{
      marginLeft:'8px',
      color: user.logins_remaining <= 2 ? 'var(--red)' : 'var(--text3)',
      fontSize:'11px'
    }}>
      ({user.logins_remaining} free login{user.logins_remaining !== 1 ? 's' : ''} left)
    </span>
  )}
          </span>
          <button
            className="refresh-btn"
            onClick={refreshStocks}
            disabled={refreshing}
            style={{padding:'8px 16px', borderRadius:'6px'}}
          >
            {refreshing ? '⟳ Updating...' : '↻ Refresh Stocks'}
          </button>
          <button className="btn-ai" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? '⟳ Analyzing...' : '✦ AI Analysis'}
          </button>
          <button
            className="btn-add"
            style={{background:'var(--accent)'}}
            onClick={() => setShowScreenshotImport(true)}
          >
            📸 Import Screenshot
          </button>
          <button className="btn-add" onClick={() => setShowAdd(true)}>+ Add Position</button>
          <button className="btn-cancel" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {summary && <Summary summary={summary} />}

      {analysis && <AIAnalysis analysis={analysis} onClose={() => setAnalysis(null)} />}

      <main className="main">
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading positions...</span>
          </div>
        ) : (
          <PositionTable
            positions={positions}
            onDelete={deletePosition}
            onRefresh={fetchPositions}
            onEdit={setEditingPosition}
            onAnalyze={setAnalyzingPosition}
          />
        )}
      </main>

      {showAdd && (
        <AddPositionModal
          onAdd={addPosition}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          onSave={savePosition}
          onClose={() => setEditingPosition(null)}
        />
      )}

      {analyzingPosition && (
        <PositionAnalysisModal
          position={analyzingPosition}
          token={token}
          onClose={() => setAnalyzingPosition(null)}
        />
      )}

      {sellRecommendations && (
        <SellRecommendationsModal
          analysis={sellRecommendations}
          onClose={() => setSellRecommendations(null)}
        />
      )}

      {showScreenshotImport && (
        <ScreenshotImportModal
          token={token}
          onImported={fetchPositions}
          onClose={() => setShowScreenshotImport(false)}
        />
      )}
    </div>
  )
}