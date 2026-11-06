import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../api.js'
import AuthShell, { LockIcon } from '../AuthShell.jsx'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [state, setState] = useState('checking')   // checking | ok | bad | done
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [tries, setTries] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi.checkReset(token).then(() => setState('ok')).catch((e) => { setError(e.message); setState('bad') })
  }, [token])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); setTries((n) => n + 1); return }
    if (pw !== pw2) { setError('The two passwords do not match.'); setTries((n) => n + 1); return }
    setBusy(true)
    try {
      await adminApi.resetPassword(token, pw)
      setState('done')
      setTimeout(() => navigate('/admin/login', { replace: true }), 2500)
    } catch (err) {
      setError(err.message)
      setTries((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  // 0-4: length, upper+lower, digit, symbol
  const strength = pw.length === 0 ? 0 : (pw.length >= 8) + (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) + /\d/.test(pw) + /[^A-Za-z0-9]/.test(pw)

  return (
    <AuthShell title="Set a new password" subtitle={state === 'done' ? 'All done' : 'Choose a strong password for your account'}
               error={state === 'ok' ? error : ''} shakeKey={tries}>
      {state === 'checking' && <p className="login-done">Checking your link...</p>}
      {state === 'bad' && (
        <div className="login-done">
          <div className="login-error" role="alert">{error}</div>
          <Link className="adm-btn adm-btn-block login-btn" to="/admin/forgot-password">Request a new link</Link>
        </div>
      )}
      {state === 'done' && (
        <div className="login-done">
          <span className="done-icon ok"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg></span>
          <p>Your password has been changed. Taking you to sign in...</p>
        </div>
      )}
      {state === 'ok' && (
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <span className="field-icon"><LockIcon /></span>
            <input aria-label="New password" type={show ? 'text' : 'password'} autoComplete="new-password" autoFocus value={pw}
                   onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 characters)" />
            <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <div className={'pw-meter s' + strength} aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="field">
            <span className="field-icon"><LockIcon /></span>
            <input aria-label="Confirm new password" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2}
                   onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" />
          </div>
          <button className={'adm-btn adm-btn-block login-btn' + (busy ? ' busy' : '')} disabled={busy || !pw || !pw2}>
            {busy ? <><span className="spin" />Saving...</> : 'Change password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
