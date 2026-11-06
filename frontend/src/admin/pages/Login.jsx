import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { ADMIN_LOGO } from '../adminAssets.js'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-a" />
      <div className="login-glow login-glow-b" />

      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-head">
          <img className="login-logo-img" src={ADMIN_LOGO} alt="JBM" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span className="login-logo">JBM</span>
          <span className="login-rule" />
          <h1>Admin Panel</h1>
          <p>Sign in to manage your website</p>
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <div className="field">
          <span className="field-icon"><UserIcon /></span>
          <input id="username" aria-label="Username" autoComplete="username" autoFocus value={username}
                 onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        </div>

        <div className="field">
          <span className="field-icon"><LockIcon /></span>
          <input id="password" aria-label="Password" type={show ? 'text' : 'password'} autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>

        <button className="adm-btn adm-btn-block" disabled={busy || !username || !password}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="login-foot">Authorized personnel only</p>
      </form>
    </div>
  )
}
