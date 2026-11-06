import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { useToast } from '../Toast.jsx'

function Counter({ value, ideal }) {
  const n = value.length
  return <span className={'counter' + (n > ideal ? ' over' : '')}>{n} / {ideal} recommended</span>
}

export default function SEO() {
  const toast = useToast()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => { adminApi.seo.get().then((r) => setF(r.seo)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const r = await adminApi.seo.save(f)
      setF(r.seo); toast.success('SEO settings saved successfully')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  if (!f) return <div className="muted">Loading...</div>

  return (
    <>
      <div className="page-head"><h1>SEO</h1></div>
      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Meta Information</h3></div>
          <div className="card-body">
            <div className={'fld' + (errors.meta_title ? ' bad' : '')} style={{ marginTop: 0 }}>
              <label htmlFor="meta_title">Meta title</label>
              <input id="meta_title" type="text" value={f.meta_title} onChange={set('meta_title')} />
              {errors.meta_title ? <div className="msg">{errors.meta_title}</div> : <div className="hint"><Counter value={f.meta_title} ideal={60} /></div>}
            </div>

            <div className={'fld' + (errors.meta_description ? ' bad' : '')}>
              <label htmlFor="meta_description">Meta description</label>
              <textarea id="meta_description" rows="3" value={f.meta_description} onChange={set('meta_description')} />
              {errors.meta_description ? <div className="msg">{errors.meta_description}</div> : <div className="hint"><Counter value={f.meta_description} ideal={160} /></div>}
            </div>

            <div className={'fld' + (errors.primary_keywords ? ' bad' : '')}>
              <label htmlFor="primary_keywords">Primary keywords</label>
              <textarea id="primary_keywords" rows="2" value={f.primary_keywords} onChange={set('primary_keywords')} />
              {errors.primary_keywords ? <div className="msg">{errors.primary_keywords}</div> : <div className="hint">Separate keywords with commas.</div>}
            </div>

            <div className={'fld' + (errors.secondary_keywords ? ' bad' : '')}>
              <label htmlFor="secondary_keywords">Secondary keywords</label>
              <textarea id="secondary_keywords" rows="2" value={f.secondary_keywords} onChange={set('secondary_keywords')} />
              {errors.secondary_keywords ? <div className="msg">{errors.secondary_keywords}</div> : <div className="hint">Separate keywords with commas.</div>}
            </div>
          </div>
        </section>
        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
