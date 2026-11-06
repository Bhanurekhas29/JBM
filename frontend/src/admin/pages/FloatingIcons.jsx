import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { useToast } from '../Toast.jsx'

export default function FloatingIcons() {
  const toast = useToast()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => { adminApi.floating.get().then((r) => setF(r.floating)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const r = await adminApi.floating.save(f)
      setF(r.floating); toast.success('Floating icons saved successfully')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  if (!f) return <div className="muted">Loading...</div>

  const text = (k, label, extra = {}, hint) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={f[k]} onChange={set(k)} {...extra} />
      {errors[k] ? <div className="msg">{errors[k]}</div> : hint && <div className="hint">{hint}</div>}
    </div>
  )

  return (
    <>
      <div className="page-head"><h1>Floating Icons</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>WhatsApp</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_whatsapp} onChange={set('show_whatsapp')} /> Show the WhatsApp icon on the website</label>
            {text('whatsapp_number', 'WhatsApp number', { placeholder: '+91 98765 43210', style: { maxWidth: 360 } }, 'Include the country code.')}
            {text('whatsapp_message', 'Pre-filled message (optional)', { placeholder: 'Hello, I would like to know more about your services.' }, 'This text appears ready to send when the visitor opens WhatsApp.')}
            {f.whatsapp_url && <div className="hint" style={{ marginTop: 8 }}>Link: <a href={f.whatsapp_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>{f.whatsapp_url.slice(0, 60)}{f.whatsapp_url.length > 60 ? '…' : ''}</a></div>}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Call</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_call} onChange={set('show_call')} /> Show the Call icon on the website</label>
            {text('call_number', 'Phone number', { placeholder: '+91 98765 43210', style: { maxWidth: 360 } }, 'Visitors on a phone tap it to call this number.')}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Position</h3></div>
          <div className="card-body">
            <div className={'fld' + (errors.position ? ' bad' : '')} style={{ marginTop: 0, maxWidth: 260 }}>
              <label htmlFor="position">Show the icons on the</label>
              <select id="position" value={f.position} onChange={set('position')}>
                <option value="right">Right side of the screen</option>
                <option value="left">Left side of the screen</option>
              </select>
              {errors.position && <div className="msg">{errors.position}</div>}
            </div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
