import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

export default function CtaBanner() {
  const toast = useToast()
  const fileInput = useRef(null)
  const [f, setF] = useState(null)
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const apply = (c) => { setF(c); setImg({ file: null, removed: false }) }
  useEffect(() => { adminApi.cta.get().then((r) => apply(r.cta)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    ;['tagline', 'heading_before', 'heading_gold', 'heading_after', 'description', 'button_label', 'button_url'].forEach((k) => fd.append(k, f[k]))
    if (f.show_section) fd.append('show_section', '1')
    if (f.button_new_tab) fd.append('button_new_tab', '1')
    if (img.file) fd.append('bg_image', img.file)
    else if (img.removed) fd.append('remove_bg_image', '1')
    try {
      const r = await adminApi.cta.save(fd)
      apply(r.cta); toast.success('Talk to Our Team banner saved successfully')
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
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : f.bg_image_url

  return (
    <>
      <div className="page-head"><h1>Talk to Our Team</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Text</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_section} onChange={set('show_section')} /> Show this banner on the website</label>
            {text('tagline', 'Small line above the heading', { placeholder: 'Patent • Trademark • Copyright • Commercial Agreements' })}
            <div className="grid2">
              {text('heading_before', 'Heading, first part (white)', { placeholder: 'Not sure which' })}
              {text('heading_gold', 'Highlighted part (gold)', { placeholder: 'IP service' })}
            </div>
            {text('heading_after', 'Heading, last part (white)', { placeholder: 'you need?', style: { maxWidth: 480 } })}
            <div className={'fld' + (errors.description ? ' bad' : '')}>
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="3" value={f.description} onChange={set('description')} />
              {errors.description && <div className="msg">{errors.description}</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Button</h3></div>
          <div className="card-body">
            <div className="grid2">
              {text('button_label', 'Button label', { placeholder: 'Talk to Our Team' })}
              {text('button_url', 'Button link', { placeholder: '#contact' })}
            </div>
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.78rem', marginTop: 8 }}>Clear the label to hide the button.</div>
            <label className="chk"><input type="checkbox" checked={f.button_new_tab} onChange={set('button_new_tab')} /> Open in a new tab</label>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Background image</h3></div>
          <div className="card-body">
            <div className={'img-slot' + (errors.bg_image ? ' bad' : '')} style={{ maxWidth: 560 }}>
              <div className="img-slot-head"><small>Wide image, around 1800 x 600. JPG, PNG or WEBP, max 2 MB.</small></div>
              <div className="img-preview dark" style={{ height: 150 }}>
                {preview ? <img src={preview} alt="Banner background" /> : <span><Icon.image width={26} height={26} />No image</span>}
              </div>
              {errors.bg_image && <div className="msg">{errors.bg_image}</div>}
              <div className="img-actions">
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden
                       onChange={(e) => e.target.files[0] && setImg({ file: e.target.files[0], removed: false })} />
                <button type="button" className="adm-btn sm ghost" onClick={() => fileInput.current.click()}>{preview ? 'Replace' : 'Upload'}</button>
                {preview && <button type="button" className="adm-btn sm ghost danger" onClick={() => { fileInput.current.value = ''; setImg({ file: null, removed: true }) }}>Remove</button>}
                {img.file && <small className="muted">{img.file.name}</small>}
              </div>
            </div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
