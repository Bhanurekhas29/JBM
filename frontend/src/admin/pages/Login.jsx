import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import AuthShell, { UserIcon, LockIcon } from '../AuthShell.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [tries, setTries] = useState(0)
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
      setTries((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Admin Panel" subtitle="Sign in to manage your website" error={error} shakeKey={tries}>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <span className="field-icon"><UserIcon /></span>
          <input id="username" aria-label="Username or email" autoComplete="username" autoFocus value={username}
                 onChange={(e) => setUsername(e.target.value)} placeholder="Username or email" />
        </div>

        <div className="field">
          <span className="field-icon"><LockIcon /></span>
          <input id="password" aria-label="Password" type={show ? 'text' : 'password'} autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
        </div>

        <div className="login-links"><Link to="/admin/forgot-password">Forgot password?</Link></div>

        <button className={'adm-btn adm-btn-block login-btn' + (busy ? ' busy' : '')} disabled={busy || !username || !password}>
          {busy ? <><span className="spin" />Signing in...</> : 'Sign In'}
        </button>
      </form>
    </AuthShell>
  )
}
