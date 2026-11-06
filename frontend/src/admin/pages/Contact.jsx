import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

const ICONS = [
  ['bolt', 'Lightning'], ['shield', 'Shield'], ['users', 'People'], ['check', 'Tick'],
  ['lightbulb', 'Idea'], ['handshake', 'Handshake'], ['chat', 'Chat'], ['document', 'Document'],
]

export default function Contact() {
  const toast = useToast()
  const fileInput = useRef(null)
  const [f, setF] = useState(null)
  const [points, setPoints] = useState([])
  const [options, setOptions] = useState([])
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setPoint = (i, k, v) => setPoints(points.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  const apply = (c) => { setF(c); setPoints(c.points); setOptions(c.service_options); setImg({ file: null, removed: false }) }
  useEffect(() => { adminApi.contact.get().then((r) => apply(r.contact)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    ;['eyebrow', 'heading_before', 'heading_gold', 'description', 'form_title', 'form_subtitle', 'consent_text', 'button_label', 'success_message']
      .forEach((k) => fd.append(k, f[k]))
    if (f.show_section) fd.append('show_section', '1')
    fd.append('points', JSON.stringify(points))
    fd.append('service_options', JSON.stringify(options))
    if (img.file) fd.append('image', img.file)
    else if (img.removed) fd.append('remove_image', '1')
    try {
      const r = await adminApi.contact.save(fd)
      apply(r.contact); toast.success('Contact section saved successfully')
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
  const area = (k, label, rows, hint) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <textarea id={k} rows={rows} value={f[k]} onChange={set(k)} />
      {errors[k] ? <div className="msg">{errors[k]}</div> : hint && <div className="hint">{hint}</div>}
    </div>
  )
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : f.image_url

  return (
    <>
      <div className="page-head"><h1>Contact</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Left side text</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_section} onChange={set('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 320 } })}
            <div className="grid2">
              {text('heading_before', 'Heading (white)', { placeholder: 'Tell us what you want to' })}
              {text('heading_gold', 'Heading continued (gold)', { placeholder: 'build or protect.' })}
            </div>
            {area('description', 'Description', 3)}
            <div className={'fld' + (errors.points ? ' bad' : '')}>
              <label>Points (icon, title, text)</label>
              {points.map((x, i) => (
                <div className="feat-row" key={i}>
                  <span className="list-no">{i + 1}</span>
                  <select value={x.icon} onChange={(e) => setPoint(i, 'icon', e.target.value)} aria-label="Icon">
                    {ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input type="text" placeholder="Title" value={x.title} onChange={(e) => setPoint(i, 'title', e.target.value)} />
                  <input type="text" placeholder="Short text" value={x.text} onChange={(e) => setPoint(i, 'text', e.target.value)} />
                  <button type="button" className="row-btn danger" title="Remove" onClick={() => setPoints(points.filter((_, j) => j !== i))}><Icon.trash /></button>
                </div>
              ))}
              {errors.points && <div className="msg">{errors.points}</div>}
              {points.length < 4 && <button type="button" className="adm-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setPoints([...points, { icon: 'check', title: '', text: '' }])}><Icon.plus width={15} height={15} /> Add point</button>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Section background image</h3></div>
          <div className="card-body">
            <div className={'img-slot' + (errors.image ? ' bad' : '')} style={{ maxWidth: 560 }}>
              <div className="img-slot-head"><small>Wide image (about 2000 x 750) with the navy panel on the left and white space on the right for the form. JPG, PNG or WEBP, max 2 MB.</small></div>
              <div className="img-preview" style={{ height: 170 }}>
                {preview ? <img src={preview} alt="Contact background" /> : <span><Icon.image width={26} height={26} />No image</span>}
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
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Enquiry form</h3></div>
          <div className="card-body">
            {text('form_title', 'Form title')}
            {text('form_subtitle', 'Form sub-text')}
            {area('consent_text', 'Consent checkbox text', 3, 'Visitors must tick this before they can send the enquiry.')}
            <div className="grid2">
              {text('button_label', 'Button label', { placeholder: 'Send Enquiry' })}
              {text('success_message', 'Message after sending')}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Service dropdown options</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem', marginBottom: 8 }}>The choices in the form's "Select Service" box, in this order. The form only accepts values from this list. Up to 20.</div>
            <div className={'fld' + (errors.service_options ? ' bad' : '')} style={{ marginTop: 0 }}>
              {options.map((o, i) => (
                <div className="list-row" key={i}>
                  <span className="list-no">{i + 1}</span>
                  <input type="text" value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" className="row-btn" title="Move up" disabled={i === 0}
                          onClick={() => { const a = [...options]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setOptions(a) }}><Icon.chevron style={{ transform: 'rotate(-90deg)' }} width={16} height={16} /></button>
                  <button type="button" className="row-btn" title="Move down" disabled={i === options.length - 1}
                          onClick={() => { const a = [...options]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setOptions(a) }}><Icon.chevron style={{ transform: 'rotate(90deg)' }} width={16} height={16} /></button>
                  <button type="button" className="row-btn danger" title="Remove" onClick={() => setOptions(options.filter((_, j) => j !== i))}><Icon.trash /></button>
                </div>
              ))}
              {errors.service_options && <div className="msg">{errors.service_options}</div>}
              {options.length < 20 && <button type="button" className="adm-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setOptions([...options, ''])}><Icon.plus width={15} height={15} /> Add option</button>}
            </div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
