import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

const ICONS = [
  ['shield', 'Shield'], ['document', 'Document'], ['bolt', 'Lightning'], ['users', 'People'],
  ['star', 'Star'], ['lightbulb', 'Idea'], ['briefcase', 'Briefcase'], ['handshake', 'Handshake'],
]

export default function Hero() {
  const toast = useToast()
  const fileInput = useRef(null)
  const [f, setF] = useState(null)
  const [points, setPoints] = useState([])
  const [hl, setHl] = useState([])
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const apply = (h) => { setF(h); setPoints(h.card_points); setHl(h.highlights); setImg({ file: null, removed: false }) }
  useEffect(() => { adminApi.hero.get().then((r) => apply(r.hero)) }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    ;['eyebrow', 'headline_1', 'headline_2', 'headline_3', 'description', 'btn1_label', 'btn1_url', 'btn2_label', 'btn2_url', 'card_title', 'card_text']
      .forEach((k) => fd.append(k, f[k]))
    if (f.show_card) fd.append('show_card', '1')
    if (f.show_highlights) fd.append('show_highlights', '1')
    fd.append('card_points', JSON.stringify(points))
    fd.append('highlights', JSON.stringify(hl))
    if (img.file) fd.append('bg_image', img.file)
    else if (img.removed) fd.append('remove_bg_image', '1')
    try {
      const r = await adminApi.hero.save(fd)
      apply(r.hero); toast.success('Hero section saved successfully')
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
  const setHlField = (i, k, v) => setHl(hl.map((h, j) => (j === i ? { ...h, [k]: v } : h)))

  return (
    <>
      <div className="page-head"><h1>Hero Section</h1></div>

      <form onSubmit={submit} noValidate>
        <section className="card">
          <div className="card-head"><h3>Heading &amp; text</h3></div>
          <div className="card-body">
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 480 } })}
            <div className="grid2">
              {text('headline_1', 'Heading line 1 (white)')}
              {text('headline_2', 'Heading line 2 (gold)')}
            </div>
            {text('headline_3', 'Heading line 3 (white)', { style: { maxWidth: 480 } })}
            <div className={'fld' + (errors.description ? ' bad' : '')}>
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="6" value={f.description} onChange={set('description')} />
              {errors.description ? <div className="msg">{errors.description}</div> : <div className="hint">Leave a blank line between paragraphs.</div>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Buttons</h3></div>
          <div className="card-body">
            <div className="grid2">
              {text('btn1_label', 'Primary button label (gold)', { placeholder: 'Explore IP Services' })}
              {text('btn1_url', 'Primary button link', { placeholder: '#ip-services' })}
              {text('btn2_label', 'Secondary button label (outline)', { placeholder: 'Discuss Your Requirements' })}
              {text('btn2_url', 'Secondary button link', { placeholder: '#contact' })}
            </div>
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.78rem', marginTop: 8 }}>Clear a label to hide that button.</div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Background image</h3></div>
          <div className="card-body">
            <div className={'img-slot' + (errors.bg_image ? ' bad' : '')} style={{ maxWidth: 560 }}>
              <div className="img-slot-head"><small>Wide photo, around 1920 x 900. JPG, PNG or WEBP, max 2 MB.</small></div>
              <div className="img-preview dark" style={{ height: 180 }}>
                {preview ? <img src={preview} alt="Hero background" /> : <span><Icon.image width={26} height={26} />No image</span>}
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

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Side card</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={f.show_card} onChange={set('show_card')} /> Show the side card</label>
            {text('card_title', 'Card title')}
            {text('card_text', 'Card text')}
            <div className={'fld' + (errors.card_points ? ' bad' : '')}>
              <label>Points (tick list)</label>
              {points.map((p, i) => (
                <div className="list-row" key={i}>
                  <span className="list-no">{i + 1}</span>
                  <input type="text" value={p} onChange={(e) => setPoints(points.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" className="row-btn danger" title="Remove" onClick={() => setPoints(points.filter((_, j) => j !== i))}><Icon.trash /></button>
                </div>
              ))}
              {errors.card_points && <div className="msg">{errors.card_points}</div>}
              {points.length < 8 && <button type="button" className="adm-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setPoints([...points, ''])}><Icon.plus width={15} height={15} /> Add point</button>}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-head"><h3>Highlights bar</h3></div>
          <div className="card-body">
            <div className="hint" style={{ color: '#8a93a3', fontSize: '.8rem', marginBottom: 6 }}>The rounded strip at the bottom of the hero. Each item has an icon, a small label and a bold line.</div>
            <label className="chk" style={{ marginTop: 8 }}><input type="checkbox" checked={f.show_highlights} onChange={set('show_highlights')} /> Show the highlights bar</label>
            <div className={'fld' + (errors.highlights ? ' bad' : '')}>
              {hl.map((h, i) => (
                <div className="hl-row" key={i}>
                  <span className="list-no">{i + 1}</span>
                  <select value={h.icon} onChange={(e) => setHlField(i, 'icon', e.target.value)} aria-label="Icon">
                    {ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input type="text" placeholder="Small label (e.g. Our Model)" value={h.label} onChange={(e) => setHlField(i, 'label', e.target.value)} />
                  <input type="text" placeholder="Bold text" value={h.title} onChange={(e) => setHlField(i, 'title', e.target.value)} />
                  <button type="button" className="row-btn danger" title="Remove" onClick={() => setHl(hl.filter((_, j) => j !== i))}><Icon.trash /></button>
                </div>
              ))}
              {errors.highlights && <div className="msg">{errors.highlights}</div>}
              {hl.length < 6 && <button type="button" className="adm-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setHl([...hl, { icon: 'shield', label: '', title: '' }])}><Icon.plus width={15} height={15} /> Add item</button>}
            </div>
          </div>
        </section>

        <div className="form-bar"><button className="adm-btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  )
}
