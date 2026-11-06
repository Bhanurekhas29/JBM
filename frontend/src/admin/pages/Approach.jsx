import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

const ICONS = [
  ['target', 'Target'], ['layers', 'Layers'], ['trend', 'Growth arrow'], ['shield', 'Shield'],
  ['handshake', 'Handshake'], ['lightbulb', 'Idea'], ['users', 'People'], ['check', 'Tick'],
]

export default function Approach() {
  const toast = useToast()
  const fileInput = useRef(null)
  const [f, setF] = useState(null)
  const [features, setFeatures] = useState([])
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setFeat = (i, k, v) => setFeatures(features.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  const apply = (a) => { setF(a); setFeatures(a.features); setImg({ file: null, removed: false }) }
  useEffect(() => { adminApi.approach.get().then((r) => apply(r.approach)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    ;['eyebrow', 'heading_before', 'heading_gold', 'description', 'image_caption', 'button_label', 'button_url'].forEach((k) => fd.append(k, f[k]))
    if (f.show_section) fd.append('show_section', '1')
    if (f.button_new_tab) fd.append('button_new_tab', '1')
    fd.append('features', JSON.stringify(features))
    if (img.file) fd.append('image', img.file)
    else if (img.removed) fd.append('remove_image', '1')
    try {
      const r = await adminApi.approach.save(fd)
      apply(r.approach); toast.success('Our approach saved successfully')
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
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : f.image_url

  return (
    <>
      <div className="page-head"><h1>Our Approach</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Text</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_section} onChange={set('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 480 } })}
            <div className="grid2">
              {text('heading_before', 'Heading (navy)', { placeholder: 'One coordinated starting point for' })}
              {text('heading_gold', 'Heading continued (gold)', { placeholder: 'brand protection and growth.' })}
            </div>
            <div className={'fld' + (errors.description ? ' bad' : '')}>
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="6" value={f.description} onChange={set('description')} />
              {errors.description ? <div className="msg">{errors.description}</div> : <div className="hint">Leave a blank line between paragraphs.</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Image</h3></div>
          <div className="card-body">
            <div className={'img-slot' + (errors.image ? ' bad' : '')} style={{ maxWidth: 560 }}>
              <div className="img-slot-head"><small>Photo shown on the left. JPG, PNG or WEBP, max 2 MB.</small></div>
              <div className="img-preview" style={{ height: 190 }}>
                {preview ? <img src={preview} alt="Approach" /> : <span><Icon.image width={26} height={26} />No image</span>}
              </div>
              {errors.image && <div className="msg">{errors.image}</div>}
              <div className="img-actions">
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden
                       onChange={(e) => e.target.files[0] && setImg({ file: e.target.files[0], removed: false })} />
                <button type="button" className="adm-btn sm ghost" onClick={() => fileInput.current.click()}>{preview ? 'Replace' : 'Upload'}</button>
                {preview && <button type="button" className="adm-btn sm ghost danger" onClick={() => { fileInput.current.value = ''; setImg({ file: null, removed: true }) }}>Remove</button>}
                {img.file && <small className="muted">{img.file.name}</small>}
              </div>
            </div>
            {text('image_caption', 'Caption on the image (navy tab)', { placeholder: 'Build · Protect · Grow', style: { maxWidth: 480 } })}
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Feature columns</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem', marginBottom: 8 }}>The three icon columns under the text. Up to 4.</div>
            <div className={'fld' + (errors.features ? ' bad' : '')} style={{ marginTop: 0 }}>
              {features.map((x, i) => (
                <div className="feat-row" key={i}>
                  <span className="list-no">{i + 1}</span>
                  <select value={x.icon} onChange={(e) => setFeat(i, 'icon', e.target.value)} aria-label="Icon">
                    {ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input type="text" placeholder="Title" value={x.title} onChange={(e) => setFeat(i, 'title', e.target.value)} />
                  <input type="text" placeholder="Short text" value={x.text} onChange={(e) => setFeat(i, 'text', e.target.value)} />
                  <button type="button" className="row-btn danger" title="Remove" onClick={() => setFeatures(features.filter((_, j) => j !== i))}><Icon.trash /></button>
                </div>
              ))}
              {errors.features && <div className="msg">{errors.features}</div>}
              {features.length < 4 && <button type="button" className="adm-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setFeatures([...features, { icon: 'check', title: '', text: '' }])}><Icon.plus width={15} height={15} /> Add column</button>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Button</h3></div>
          <div className="card-body">
            <div className="grid2">
              {text('button_label', 'Button label', { placeholder: 'Start Your IP Journey' })}
              {text('button_url', 'Button link', { placeholder: '#contact' })}
            </div>
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.78rem', marginTop: 8 }}>Clear the label to hide the button.</div>
            <label className="chk"><input type="checkbox" checked={f.button_new_tab} onChange={set('button_new_tab')} /> Open in a new tab</label>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
