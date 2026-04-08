import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'

export default function AdminPage({ token, user, onBack }) {
  const [prompts, setPrompts]           = useState([])
  const [selected, setSelected]         = useState(null)   // prompt key
  const [editText, setEditText]         = useState('')
  const [changeNote, setChangeNote]     = useState('')
  const [versions, setVersions]         = useState([])
  const [showVersions, setShowVersions] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [loadingVers, setLoadingVers]   = useState(false)
  const [error, setError]               = useState(null)
  const [success, setSuccess]           = useState(null)
  const [users, setUsers]               = useState([])
  const [tab, setTab]                   = useState('prompts') // 'prompts' | 'users'

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  useEffect(() => { fetchPrompts() }, [])

  async function fetchPrompts() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/prompts`, { headers })
      if (!res.ok) { setError('Failed to load prompts'); return }
      const data = await res.json()
      setPrompts(data)
      if (data.length && !selected) selectPrompt(data[0].key, data[0].template)
    } catch (e) { setError(e.message) }
  }

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers })
      if (!res.ok) { setError('Failed to load users'); return }
      setUsers(await res.json())
    } catch (e) { setError(e.message) }
  }

  function selectPrompt(key, template) {
    setSelected(key)
    setEditText(template)
    setVersions([])
    setShowVersions(false)
    setChangeNote('')
    setError(null)
    setSuccess(null)
  }

  async function loadVersions(key) {
    setLoadingVers(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/prompts/${key}/versions`, { headers })
      const data = await res.json()
      setVersions(data)
      setShowVersions(true)
    } catch (e) { setError(e.message) }
    finally { setLoadingVers(false) }
  }

  async function savePrompt() {
    if (!selected) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/prompts/${selected}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ template: editText, change_note: changeNote || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Save failed'); return }
      setSuccess(`Saved as v${data.version}`)
      setChangeNote('')
      setPrompts(prev => prev.map(p => p.key === selected ? { ...p, ...data } : p))
      if (showVersions) loadVersions(selected)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function restoreVersion(version) {
    if (!confirm(`Restore v${version}? The current prompt will be auto-saved before restoring.`)) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/prompts/${selected}/restore/${version}`, {
        method: 'POST', headers,
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Restore failed'); return }
      setEditText(data.template)
      setSuccess(`Restored v${version} → now v${data.version}`)
      setPrompts(prev => prev.map(p => p.key === selected ? { ...p, ...data } : p))
      loadVersions(selected)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const activePrompt = prompts.find(p => p.key === selected)

  // Extract placeholder tokens from template
  const placeholders = [...new Set((editText.match(/\{\{[A-Z_]+\}\}/g) || []))]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg1)', color: 'var(--text1)' }}>
      {/* Top bar */}
      <header style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border1)',
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '56px',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
            fontSize: '20px', padding: '4px 8px', borderRadius: '4px' }}
          title="Back to portfolio"
        >←</button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text1)' }}>
          Admin Panel
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '4px' }}>
          Sellit Platform
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text1)' }}>
            {user?.name}
          </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['prompts', 'users'].map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'users') fetchUsers() }}
              style={{
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: tab === t ? 700 : 400, fontSize: '13px',
                background: tab === t ? 'var(--accent)' : 'var(--bg3)',
                color: tab === t ? '#fff' : 'var(--text2)',
              }}>
              {t === 'prompts' ? '⚙ Prompts' : '👥 Users'}
            </button>
          ))}
        </div>
        </div>
      </header>

      {tab === 'prompts' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
          {/* Sidebar */}
          <aside style={{
            width: '220px', flexShrink: 0, borderRight: '1px solid var(--border1)',
            background: 'var(--bg2)', overflowY: 'auto', padding: '12px 0',
          }}>
            <div style={{ padding: '0 16px 8px', fontSize: '10px', fontWeight: 700,
              color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prompts
            </div>
            {prompts.map(p => (
              <button key={p.key}
                onClick={() => selectPrompt(p.key, p.template)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: selected === p.key ? 'var(--accent-dim)' : 'none',
                  border: 'none', borderLeft: selected === p.key ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer', color: selected === p.key ? 'var(--accent)' : 'var(--text1)',
                  fontSize: '13px', fontWeight: selected === p.key ? 600 : 400,
                }}>
                <div>{p.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                  v{p.version}
                </div>
              </button>
            ))}
          </aside>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activePrompt && (
              <>
                {/* Editor header */}
                <div style={{
                  padding: '16px 24px', borderBottom: '1px solid var(--border1)',
                  background: 'var(--bg2)', display: 'flex', alignItems: 'flex-start', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{activePrompt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                      {activePrompt.description}
                    </div>
                    {placeholders.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {placeholders.map(ph => (
                          <span key={ph} style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                            background: 'var(--bg3)', color: 'var(--accent)', fontFamily: 'monospace',
                            border: '1px solid var(--border2)',
                          }}>{ph}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={() => loadVersions(selected)}
                      disabled={loadingVers}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border2)',
                        background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px' }}>
                      {loadingVers ? '...' : '🕓 History'}
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {error && (
                  <div style={{ margin: '12px 24px 0', padding: '10px 14px', borderRadius: '6px',
                    background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '13px' }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ margin: '12px 24px 0', padding: '10px 14px', borderRadius: '6px',
                    background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: '13px' }}>
                    ✓ {success}
                  </div>
                )}

                {/* Main layout: editor + version panel */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {/* Text editor */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: '12px' }}>
                    <textarea
                      value={editText}
                      onChange={e => { setEditText(e.target.value); setSuccess(null) }}
                      spellCheck={false}
                      style={{
                        flex: 1, resize: 'none', fontFamily: 'monospace', fontSize: '13px',
                        lineHeight: '1.6', padding: '14px', borderRadius: '8px',
                        border: '1px solid var(--border2)', background: 'var(--bg1)',
                        color: 'var(--text1)', outline: 'none', minHeight: '300px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={changeNote}
                        onChange={e => setChangeNote(e.target.value)}
                        placeholder="Optional: describe what you changed..."
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: '6px',
                          border: '1px solid var(--border2)', background: 'var(--bg1)',
                          color: 'var(--text2)', fontSize: '12px', outline: 'none',
                        }}
                      />
                      <button
                        onClick={savePrompt}
                        disabled={saving || editText === activePrompt.template}
                        style={{
                          padding: '8px 20px', borderRadius: '6px', border: 'none',
                          background: editText !== activePrompt.template ? 'var(--accent)' : 'var(--bg3)',
                          color: editText !== activePrompt.template ? '#fff' : 'var(--text3)',
                          cursor: saving || editText === activePrompt.template ? 'not-allowed' : 'pointer',
                          fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap',
                        }}>
                        {saving ? '⟳ Saving...' : '↑ Save'}
                      </button>
                    </div>
                  </div>

                  {/* Version history panel */}
                  {showVersions && (
                    <div style={{
                      width: '300px', flexShrink: 0, borderLeft: '1px solid var(--border1)',
                      background: 'var(--bg2)', display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border1)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Version History</span>
                        <button onClick={() => setShowVersions(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text3)', fontSize: '18px', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {versions.length === 0 ? (
                          <div style={{ padding: '20px 16px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center' }}>
                            No saved versions yet
                          </div>
                        ) : versions.map(v => (
                          <div key={v.id} style={{
                            padding: '12px 16px', borderBottom: '1px solid var(--border1)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '13px' }}>v{v.version}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '6px' }}>
                                  {new Date(v.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <button
                                onClick={() => restoreVersion(v.version)}
                                style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                                  border: '1px solid var(--border2)', background: 'none',
                                  color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Restore
                              </button>
                            </div>
                            {v.saved_by && (
                              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                                by {v.saved_by.name}
                              </div>
                            )}
                            {v.change_note && (
                              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px',
                                fontStyle: 'italic' }}>
                                "{v.change_note}"
                              </div>
                            )}
                            <div style={{
                              marginTop: '6px', padding: '6px 8px', borderRadius: '4px',
                              background: 'var(--bg1)', fontSize: '10px', color: 'var(--text3)',
                              fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                              maxHeight: '60px', overflow: 'hidden',
                            }}>
                              {v.template.substring(0, 120)}{v.template.length > 120 ? '...' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div style={{ padding: '24px', maxWidth: '900px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>Platform Users</h2>
          <div style={{ borderRadius: '8px', border: '1px solid var(--border1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  {['ID', 'Name', 'Email', 'Admin', 'Paid', 'Logins', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left',
                      color: 'var(--text2)', fontWeight: 600, borderBottom: '1px solid var(--border1)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border1)',
                    background: i % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{u.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {u.is_admin ? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span> : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {u.is_paid ? <span style={{ color: 'var(--green)' }}>✓</span> : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{u.login_count}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
