import { useState, useEffect } from 'react'
import PositionTable from './components/PositionTable'
import AddPositionModal from './components/AddPositionModal'
import Summary from './components/Summary'
import AIAnalysis from './components/AIAnalysis'
import EditPositionModal from './components/EditPositionModal'
import PositionAnalysisModal from './components/PositionAnalysisModal'
import LoginScreen from './components/LoginScreen'
import './App.css'

const API = import.meta.env.VITE_API_BASE_URL || 'https://tradeflow-production-c4ff.up.railway.app';
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

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }

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
      const res = await fetch(`${API}/positions`, { headers })
      const data = await res.json()
      setPositions(data.positions || [])
      setSummary(data.summary || null)
    } catch (e) {
      setError('Could not connect to API')
    } finally {
      setLoading(false)
    }
  }

  async function refreshCrypto() {
    try {
      await fetch(`${API}/prices/refresh-crypto`, { method: 'POST', headers })
      fetchPositions()
    } catch (e) {
      console.error('Crypto refresh failed')
    }
  }

  async function refreshStocks() {
    setRefreshing(true)
    try {
      const res = await fetch(`${API}/prices/refresh-stocks`, { method: 'POST', headers })
      const data = await res.json()
      fetchPositions()
    } catch (e) {
      console.error('Stock refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  async function deletePosition(id) {
    if (!confirm('Remove this position?')) return
    await fetch(`${API}/positions/${id}`, { method: 'DELETE', headers })
    fetchPositions()
  }

  async function addPosition(data) {
    await fetch(`${API}/positions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
    setShowAdd(false)
    fetchPositions()
  }

  async function savePosition(id, data) {
    await fetch(`${API}/positions/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    })
    setEditingPosition(null)
    fetchPositions()
  }

  async function runAnalysis() {
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch(`${API}/positions/analyze`, { method: 'POST', headers })
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

  // Auto-refresh crypto every 5 minutes
  useEffect(() => {
    if (!token) return
    refreshCrypto()
    const interval = setInterval(refreshCrypto, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token])

  // Refresh stocks once on login
  useEffect(() => {
    if (!token) return
    refreshStocks()
  }, [token])

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">TF</div>
          <div>
            <h1>TradeFlow</h1>
            <span className="subtitle">Portfolio Dashboard</span>
          </div>
        </div>
        <div className="header-actions">
          <span style={{fontSize:'12px', color:'var(--text3)', marginRight:'8px'}}>
            {user?.name}
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
    </div>
  )
}