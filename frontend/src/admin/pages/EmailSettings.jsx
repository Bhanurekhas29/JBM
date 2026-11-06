import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { useToast } from '../Toast.jsx'

export default function EmailSettings() {
  const toast = useToast()
  const [f, setF] = useState(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const apply = (email) => { setHasPassword(email.has_password); setF({ ...email, smtp_password: '' }) }
  useEffect(() => { adminApi.email.get().then((r) => apply(r.email)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const r = await adminApi.email.save(f)
      apply(r.email); toast.success('Email settings saved successfully')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  if (!f) return <div className="muted">Loading...</div>

  const fld = (k, label, extra = {}, hint) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={f[k]} onChange={set(k)} {...extra} />
      {errors[k] ? <div className="msg">{errors[k]}</div> : hint && <div className="hint">{hint}</div>}
    </div>
  )

  return (
    <>
      <div className="page-head"><h1>Email Settings</h1></div>
      <form onSubmit={submit} noValidate autoComplete="off">
        <section className="card">
          <div className="card-head"><h3>SMTP Server</h3></div>
          <div className="card-body">
            <div className="grid2">
              {fld('smtp_host', 'SMTP host', { placeholder: 'smtp.gmail.com' })}
              {fld('smtp_port', 'SMTP port', { inputMode: 'numeric', placeholder: '587' })}
            </div>
            <div className={'fld' + (errors.encryption ? ' bad' : '')}>
              <label htmlFor="encryption">Encryption</label>
              <select id="encryption" value={f.encryption} onChange={set('encryption')}>
                <option value="tls">TLS (STARTTLS) - usually port 587</option>
                <option value="ssl">SSL - usually port 465</option>
                <option value="none">None - usually port 25</option>
              </select>
            </div>
            <div className="grid2">
              {fld('smtp_username', 'SMTP username', { autoComplete: 'off' })}
              <div className="fld">
                <label htmlFor="smtp_password">SMTP password</label>
                <div className="pw-field">
                  <input id="smtp_password" type={showPw ? 'text' : 'password'} value={f.smtp_password} onChange={set('smtp_password')}
                         autoComplete="new-password" placeholder={hasPassword ? 'Saved - leave blank to keep' : ''} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'}</button>
                </div>
                <div className="hint">Stored encrypted. It is never shown again after saving.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Sender</h3></div>
          <div className="card-body">
            <div className="grid2">
              {fld('from_email', 'From email', { type: 'email', placeholder: 'info@yourdomain.com' })}
              {fld('from_name', 'From name', { placeholder: 'JBM' })}
            </div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
