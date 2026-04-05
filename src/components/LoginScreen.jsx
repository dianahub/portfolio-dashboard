import { useState } from 'react'
import API_BASE_URL from '../config/api'

const params = new URLSearchParams(window.location.search)

function Card({ children }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'14px', padding:'40px', width:'380px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px' }}>
          <div className="logo">TF</div>
          <div>
            <h1 style={{ fontSize:'20px', fontFamily:'var(--font-display)', fontWeight:'800' }}>Sell It?</h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function LoginScreen({ onLogin, pendingImport }) {
  const [email, setEmail] = useState(params.get('email') || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isRegister] = useState(false)
  const [name, setName] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verifiedJustNow] = useState(params.get('verified') === '1')

  // Forgot password state
  const [isForgot, setIsForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // Reset password state — active when ?token= is in the URL
  const resetToken = params.get('token')
  const [isReset] = useState(!!resetToken)
  const [newPassword, setNewPassword] = useState('')
  const [resetDone, setResetDone] = useState(false)

  // ── Forgot password ──────────────────────────────────────────────────────

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      })
      setForgotSent(true)
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  // ── Reset password ───────────────────────────────────────────────────────

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ token: resetToken, email, password: newPassword, password_confirmation: newPassword })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Reset failed'); return }
      setResetDone(true)
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  // ── Login / Register ─────────────────────────────────────────────────────

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
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.needs_verification) { setNeedsVerification(true); return }
      if (!res.ok) { setError(data.message || 'Something went wrong'); return }
      onLogin(data.token, data.user)
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setLoading(true)
    try {
      await fetch(`${API_BASE_URL}/email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      })
    } finally {
      setLoading(false)
    }
  }


  // ── Verify email screen ──────────────────────────────────────────────────

  if (needsVerification) return (
    <Card>
      <div style={{ textAlign:'center' }}>
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
    </Card>
  )

  // ── Reset password screen ────────────────────────────────────────────────

  if (isReset) return (
    <Card>
      {resetDone ? (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>✅</div>
          <h2 style={{ fontSize:'18px', marginBottom:'12px' }}>Password updated</h2>
          <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'24px' }}>You can now sign in with your new password.</p>
          <button className="btn-save" style={{ width:'100%' }} onClick={() => window.location.href = '/'}>
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize:'16px', marginBottom:'20px' }}>Set a new password</h2>
          {error && <div className="error" style={{ marginBottom:'16px' }}>{error}</div>}
          <form onSubmit={handleReset}>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} />
              </div>
            </div>
            <button type="submit" className="btn-save" style={{ width:'100%', marginTop:'22px', padding:'12px' }} disabled={loading}>
              {loading ? 'Please wait…' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </Card>
  )

  // ── Forgot password screen ───────────────────────────────────────────────

  if (isForgot) return (
    <Card>
      {forgotSent ? (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>✉️</div>
          <h2 style={{ fontSize:'18px', marginBottom:'12px' }}>Check your email</h2>
          <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'24px' }}>
            If that account exists, a reset link has been sent to <strong>{email}</strong>.
          </p>
          <button className="btn-save" style={{ width:'100%' }} onClick={() => { setIsForgot(false); setForgotSent(false) }}>
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize:'16px', marginBottom:'6px' }}>Forgot your password?</h2>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'20px' }}>Enter your email and we'll send a reset link.</p>
          {error && <div className="error" style={{ marginBottom:'16px' }}>{error}</div>}
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="btn-save" style={{ width:'100%', marginTop:'22px', padding:'12px' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:'16px', fontSize:'12px', color:'var(--text3)' }}>
            <span onClick={() => { setIsForgot(false); setError(null) }} style={{ color:'var(--accent)', cursor:'pointer' }}>
              Back to Sign In
            </span>
          </p>
        </>
      )}
    </Card>
  )

  // ── Login / Register screen ──────────────────────────────────────────────

  return (
    <Card>
      <span style={{ fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginTop:'-16px', marginBottom:'24px' }}>
        {isRegister ? 'Create Account' : 'Sign In'}
      </span>

      {pendingImport?.length > 0 && (
        <div style={{ background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'var(--text2)' }}>
          {pendingImport.length} position{pendingImport.length !== 1 ? 's' : ''} ready to import.
          {' '}{isRegister ? 'Create an account to save them.' : 'Sign in to import them.'}
        </div>
      )}

      {verifiedJustNow && (
        <div style={{ background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'var(--accent)' }}>
          Email verified! You can now sign in.
        </div>
      )}

      {error && <div className="error" style={{ marginBottom:'16px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
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

        <button type="submit" className="btn-save" style={{ width:'100%', marginTop:'22px', padding:'12px' }} disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:'12px', fontSize:'12px' }}>
        <span onClick={() => { setIsForgot(true); setError(null) }} style={{ color:'var(--text3)', cursor:'pointer' }}>
          Forgot password?
        </span>
      </p>

      <p style={{ textAlign:'center', marginTop:'16px', fontSize:'12px', color:'var(--text3)', borderTop:'1px solid var(--border2)', paddingTop:'16px' }}>
        Don't have an account?{' '}
        <span style={{ color:'var(--text2)' }}>Contact Diana for a login.</span>
      </p>
    </Card>
  )
}
