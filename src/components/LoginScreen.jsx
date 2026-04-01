import { useState } from 'react'
import API_BASE_URL from '../config/api'

export default function LoginScreen({ onLogin, pendingImport }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(!!pendingImport)
  const [name, setName] = useState('')
  const [needsVerification, setNeedsVerification] = useState(
    new URLSearchParams(window.location.search).get('verified') === null
      ? false : false  // set true below for ?verified=1
  )
  const [verifiedJustNow] = useState(
    new URLSearchParams(window.location.search).get('verified') === '1'
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const endpoint = isRegister ? '/register' : '/login'
    const body = isRegister
      ? { name, email, password, password_confirmation: password }
      : { email, password }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.needs_verification) {
        setNeedsVerification(true)
        return
      }

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
  }

  async function handleResend() {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${API_BASE_URL}/email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  if (needsVerification) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'14px', padding:'40px', width:'380px', textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>✉️</div>
          <h2 style={{ fontSize:'18px', marginBottom:'12px' }}>Check your email</h2>
          <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'24px', lineHeight:'1.6' }}>
            We sent a verification link to <strong>{email}</strong>.<br />
            Click the link to activate your account, then come back to sign in.
          </p>
          <button className="btn-save" style={{ width:'100%', marginBottom:'12px' }}
            onClick={() => { setNeedsVerification(false); setIsRegister(false) }}>
            Go to Sign In
          </button>
          <p style={{ fontSize:'12px', color:'var(--text3)' }}>
            Didn't get it?{' '}
            <span onClick={handleResend} style={{ color:'var(--accent)', cursor:'pointer' }}>
              {loading ? 'Sending…' : 'Resend email'}
            </span>
          </p>
        </div>
      </div>
    )
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

        {pendingImport?.length > 0 && (
          <div style={{
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--text2)',
          }}>
            {pendingImport.length} position{pendingImport.length !== 1 ? 's' : ''} ready to import from your brokerage.
            {' '}{isRegister ? 'Create an account to save them.' : 'Sign in to import them.'}
          </div>
        )}

        {verifiedJustNow && (
          <div style={{ background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'var(--accent)' }}>
            Email verified! You can now sign in.
          </div>
        )}

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