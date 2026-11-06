import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api.js'
import AuthShell, { MailIcon } from '../AuthShell.jsx'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [tries, setTries] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await adminApi.forgotPassword(email.trim())
      setDone(r.message)
    } catch (err) {
      setError(err.message)
      setTries((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we will send you a reset link" error={error} shakeKey={tries} foot="Link is valid for 60 minutes">
      {done ? (
        <div className="login-done">
          <span className="done-icon"><MailIcon /></span>
          <p>{done}</p>
          <Link className="adm-btn adm-btn-block login-btn" to="/admin/login">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <span className="field-icon"><MailIcon /></span>
            <input aria-label="Email" type="email" autoComplete="email" autoFocus value={email}
                   onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" />
          </div>
          <button className={'adm-btn adm-btn-block login-btn' + (busy ? ' busy' : '')} disabled={busy || !email}>
            {busy ? <><span className="spin" />Sending...</> : 'Send reset link'}
          </button>
          <div className="login-links center"><Link to="/admin/login">&larr; Back to sign in</Link></div>
        </form>
      )}
    </AuthShell>
  )
}
