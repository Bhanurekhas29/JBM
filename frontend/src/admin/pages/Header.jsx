import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { useToast } from '../Toast.jsx'
import NavLinks from './NavLinks.jsx'

export default function Header() {
  const toast = useToast()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => { adminApi.header.get().then((r) => setF(r.header)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const r = await adminApi.header.save(f)
      setF(r.header); toast.success('Header settings saved successfully')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  if (!f) return <div className="muted">Loading...</div>

  const text = (k, label, extra = {}) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={f[k]} onChange={set(k)} {...extra} />
      {errors[k] && <div className="msg">{errors[k]}</div>}
    </div>
  )

  return (
    <>
      <div className="page-head"><h1>Header</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Top bar</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_topbar} onChange={set('show_topbar')} /> Show the top bar</label>
            {text('topbar_left', 'Left text')}
            {text('topbar_right', 'Right text')}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Header button</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_cta} onChange={set('show_cta')} /> Show the button</label>
            <div className="grid2">
              {text('cta_label', 'Button label', { placeholder: 'Start an Enquiry' })}
              {text('cta_url', 'Button link', { placeholder: '#contact' })}
            </div>
            <label className="chk"><input type="checkbox" checked={f.cta_new_tab} onChange={set('cta_new_tab')} /> Open in a new tab</label>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>

      <div style={{ marginTop: 24 }}><NavLinks /></div>
    </>
  )
}
