import { useState } from 'react'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')

  async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setError(null)

  const endpoint = isRegister ? '/api/register' : '/api/login'
  const body = isRegister
    ? { name, email, password, password_confirmation: password }
    : { email, password }

    try {
      const res = await fetch(`https://tradeflow-production.up.railway.app${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Something went wrong')
        return
      }
      onLogin(data.token, data.user)
    } catch (e) {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }

    onLogin(data.token, data.user)
  } catch (e) {
    setError('Could not connect to server')
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: '14px',
        padding: '40px',
        width: '380px'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'32px'}}>
          <div className="logo">TF</div>
          <div>
            <h1 style={{fontSize:'20px', fontFamily:'var(--font-display)', fontWeight:'800'}}>Sell It?</h1>
            <span style={{fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </span>
          </div>
        </div>

        {error && <div className="error" style={{marginBottom:'16px'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
            {isRegister && (
              <div className="form-group">
                <label>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Diana" required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" className="btn-save" style={{width:'100%', marginTop:'22px', padding:'12px'}} disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{textAlign:'center', marginTop:'18px', fontSize:'12px', color:'var(--text3)'}}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(null) }}
            style={{color:'var(--accent)', cursor:'pointer'}}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  )
}