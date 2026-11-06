import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

export default function Footer() {
  const toast = useToast()
  const [f, setF] = useState(null)
  const [columns, setColumns] = useState([])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const apply = (d) => { setF(d); setColumns(d.columns) }
  useEffect(() => { adminApi.footer.get().then((r) => apply(r.footer)) }, [])

  const setCol = (ci, patch) => setColumns(columns.map((c, i) => (i === ci ? { ...c, ...patch } : c)))
  const setLink = (ci, li, patch) => setCol(ci, { links: columns[ci].links.map((l, i) => (i === li ? { ...l, ...patch } : l)) })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      const r = await adminApi.footer.save({ ...f, columns })
      apply(r.footer); toast.success('Footer saved successfully')
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
  const social = (k, label) => (
    <div className={'fld' + (errors['social_' + k] ? ' bad' : '')}>
      <label htmlFor={'s_' + k}>{label}</label>
      <input id={'s_' + k} type="text" placeholder="https://" value={f.socials[k]} onChange={(e) => setF({ ...f, socials: { ...f.socials, [k]: e.target.value } })} />
      {errors['social_' + k] && <div className="msg">{errors['social_' + k]}</div>}
    </div>
  )

  return (
    <>
      <div className="page-head"><h1>Footer</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>About</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem' }}>The logo and the company name / tagline come from the Brand page.</div>
            <div className={'fld' + (errors.about_text ? ' bad' : '')}>
              <label htmlFor="about_text">Short description</label>
              <textarea id="about_text" rows="3" value={f.about_text} onChange={set('about_text')} />
              {errors.about_text && <div className="msg">{errors.about_text}</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head row">
            <h3>Link columns ({columns.length})</h3>
            {columns.length < 4 && <button type="button" className="adm-btn sm" onClick={() => setColumns([...columns, { title: '', links: [] }])}><Icon.plus width={16} height={16} /> Add column</button>}
          </div>
          <div className="card-body">
            {errors.columns && <div className="alert-err" style={{ marginTop: 0, marginBottom: 14 }}>{errors.columns}</div>}
            {!columns.length && <div className="muted">No columns yet.</div>}
            <div className="col-grid">
              {columns.map((c, ci) => (
                <div className="col-box" key={ci}>
                  <div className="col-head">
                    <input type="text" placeholder="Column title" value={c.title} onChange={(e) => setCol(ci, { title: e.target.value })} />
                    <button type="button" className="row-btn danger" title="Remove column" onClick={() => setColumns(columns.filter((_, i) => i !== ci))}><Icon.trash /></button>
                  </div>
                  {c.links.map((l, li) => (
                    <div className="link-row" key={li}>
                      <span className="list-no">{li + 1}</span>
                      <input type="text" placeholder="Label" value={l.label} onChange={(e) => setLink(ci, li, { label: e.target.value })} />
                      <input type="text" placeholder="#section or /page" value={l.url} onChange={(e) => setLink(ci, li, { url: e.target.value })} />
                      <button type="button" className="row-btn danger" title="Remove link" onClick={() => setCol(ci, { links: c.links.filter((_, i) => i !== li) })}><Icon.trash /></button>
                    </div>
                  ))}
                  {c.links.length < 10 && <button type="button" className="adm-btn sm ghost" onClick={() => setCol(ci, { links: [...c.links, { label: '', url: '' }] })}><Icon.plus width={15} height={15} /> Add link</button>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Contact details</h3></div>
          <div className="card-body">
            <div className="grid2">
              {text('phone', 'Phone', { placeholder: '+91 ...' })}
              {text('email', 'Email', { type: 'email', placeholder: 'info@yourdomain.com' })}
            </div>
            {text('address', 'Address')}
            {text('office_hours', 'Office hours')}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Social links</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem' }}>Leave a link empty to hide that icon.</div>
            <div className="grid2">
              {social('linkedin', 'LinkedIn')}
              {social('instagram', 'Instagram')}
              {social('x', 'X (Twitter)')}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Bottom bar</h3></div>
          <div className="card-body">
            {text('bottom_tagline', 'Tagline line')}
            {text('copyright_text', 'Copyright text')}
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.78rem', marginTop: 4 }}>Type <b>{'{year}'}</b> where the current year should appear, so it updates every year.</div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
