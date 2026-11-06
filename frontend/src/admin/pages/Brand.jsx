import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

const SLOTS = [
  { key: 'header_logo', label: 'Header Logo', hint: 'Shown in the website header. PNG, JPG, WEBP or GIF, max 2 MB.', accept: 'image/png,image/jpeg,image/webp,image/gif', dark: false },
  { key: 'footer_logo', label: 'Footer Logo', hint: 'Shown in the website footer. PNG, JPG, WEBP or GIF, max 2 MB.', accept: 'image/png,image/jpeg,image/webp,image/gif', dark: true },
  { key: 'favicon', label: 'Favicon', hint: 'Browser tab icon. Square PNG or ICO, max 2 MB.', accept: 'image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,image/gif', dark: false },
]

function ImageSlot({ slot, current, state, onChange, error }) {
  const input = useRef(null)
  const preview = state.file ? URL.createObjectURL(state.file) : state.removed ? '' : current
  const pick = (e) => { const f = e.target.files[0]; if (f) onChange({ file: f, removed: false }) }

  return (
    <div className={'img-slot' + (error ? ' bad' : '')}>
      <div className="img-slot-head"><strong>{slot.label}</strong><small>{slot.hint}</small></div>
      <div className={'img-preview' + (slot.dark ? ' dark' : '')}>
        {preview ? <img src={preview} alt={slot.label} /> : <span><Icon.image width={26} height={26} />No image</span>}
      </div>
      {error && <div className="msg">{error}</div>}
      <div className="img-actions">
        <input ref={input} type="file" accept={slot.accept} hidden onChange={pick} />
        <button type="button" className="adm-btn sm ghost" onClick={() => input.current.click()}>{preview ? 'Replace' : 'Upload'}</button>
        {preview && <button type="button" className="adm-btn sm ghost danger" onClick={() => { input.current.value = ''; onChange({ file: null, removed: true }) }}>Remove</button>}
        {state.file && <small className="muted">{state.file.name}</small>}
      </div>
    </div>
  )
}

export default function Brand() {
  const [brand, setBrand] = useState(null)
  const [name, setName] = useState('')
  const [company, setCompany] = useState({ company_name: '', company_descriptor: '', tagline: '' })
  const [credits, setCredits] = useState(true)
  const [creditsUrl, setCreditsUrl] = useState('')
  const [files, setFiles] = useState({})
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const apply = (b) => { setBrand(b); setName(b.website_name); setCompany({ company_name: b.company_name || '', company_descriptor: b.company_descriptor || '', tagline: b.tagline || '' }); setCredits(b.show_credits); setCreditsUrl(b.credits_url || ''); setFiles({}) }
  useEffect(() => { adminApi.brand.get().then((r) => apply(r.brand)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(''); setErrors({})
    const fd = new FormData()
    fd.append('website_name', name)
    Object.entries(company).forEach(([k, v]) => fd.append(k, v))
    if (credits) fd.append('show_credits', '1')
    fd.append('credits_url', creditsUrl)
    SLOTS.forEach(({ key }) => {
      const s = files[key]
      if (s?.file) fd.append(key, s.file)
      else if (s?.removed) fd.append('remove_' + key, '1')
    })
    try {
      const r = await adminApi.brand.save(fd)
      apply(r.brand); toast.success('Brand saved successfully')
    } catch (err) {
      setError(err.message); setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  if (!brand) return <div className="muted">Loading...</div>

  return (
    <>
      <div className="page-head"><h1>Brand</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-head"><h3>Website</h3></div>
          <div className="card-body">
            <div className={'fld' + (errors.website_name ? ' bad' : '')} style={{ marginTop: 0, maxWidth: 480 }}>
              <label htmlFor="website_name">Website name</label>
              <input id="website_name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.website_name && <div className="msg">{errors.website_name}</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-head"><h3>Logo text</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem', marginBottom: 4 }}>Shown beside the logo in the website header and footer.</div>
            <div className="grid2">
              {[['company_name', 'Company name', 'JOSH'], ['company_descriptor', 'Descriptor', 'Brand Management Solutions']].map(([k, label, ph]) => (
                <div key={k} className={'fld' + (errors[k] ? ' bad' : '')}>
                  <label htmlFor={k}>{label}</label>
                  <input id={k} type="text" placeholder={ph} value={company[k]} onChange={(e) => setCompany({ ...company, [k]: e.target.value })} />
                  {errors[k] && <div className="msg">{errors[k]}</div>}
                </div>
              ))}
            </div>
            <div className={'fld' + (errors.tagline ? ' bad' : '')} style={{ maxWidth: 480 }}>
              <label htmlFor="tagline">Tagline</label>
              <input id="tagline" type="text" placeholder="Build · Protect · Grow" value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} />
              {errors.tagline && <div className="msg">{errors.tagline}</div>}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>Logos &amp; Favicon</h3></div>
          <div className="card-body img-grid">
            {SLOTS.map((s) => (
              <ImageSlot key={s.key} slot={s} current={brand[s.key + '_url']} state={files[s.key] || {}}
                         error={errors[s.key]} onChange={(v) => setFiles({ ...files, [s.key]: v })} />
            ))}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Credits</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}>
              <input type="checkbox" checked={credits} onChange={(e) => setCredits(e.target.checked)} />
              Designed &amp; Developed by Vetri IT Systems
            </label>
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.78rem', marginTop: 6 }}>When ticked, this credit line is shown in the website footer as a link.</div>
            <div className={'fld' + (errors.credits_url ? ' bad' : '')} style={{ maxWidth: 480 }}>
              <label htmlFor="credits_url">Link (URL)</label>
              <input id="credits_url" type="text" placeholder="https://" value={creditsUrl} onChange={(e) => setCreditsUrl(e.target.value)} />
              {errors.credits_url && <div className="msg">{errors.credits_url}</div>}
            </div>
          </div>
        </section>

        {error && !Object.keys(errors).length && <div className="alert-err">{error}</div>}
        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>

    </>
  )
}
