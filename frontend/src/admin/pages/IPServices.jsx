import { useEffect, useState, useCallback, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'

const empty = { id: 0, category: '', title: '', description: '', image_url: '', button_label: 'Explore Service', button_url: '#contact', is_active: true, is_wide: false, features: [], position: '' }

function ServiceModal({ initial, onClose, onSaved }) {
  const toast = useToast()
  const fileInput = useRef(null)
  const editing = !!initial.id
  const [f, setF] = useState(initial)
  const [features, setFeatures] = useState(initial.features || [])
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : f.image_url

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    fd.append('action', 'service')
    if (editing) fd.append('id', f.id)
    ;['category', 'title', 'description', 'button_label', 'button_url', 'position'].forEach((k) => fd.append(k, f[k] ?? ''))
    if (f.is_active) fd.append('is_active', '1')
    if (f.is_wide) fd.append('is_wide', '1')
    fd.append('features', JSON.stringify(features))
    if (img.file) fd.append('image', img.file)
    else if (img.removed) fd.append('remove_image', '1')
    try {
      await adminApi.ipServices.saveService(fd)
      onSaved(editing ? 'Service updated' : 'Service created')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  const text = (k, label, extra = {}) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={f[k]} onChange={set(k)} {...extra} />
      {errors[k] && <div className="msg">{errors[k]}</div>}
    </div>
  )

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 520 }}>
        <h3>{editing ? 'Edit service' : 'Add service'}</h3>
        <form onSubmit={submit} noValidate>
          <div className={'img-slot' + (errors.image ? ' bad' : '')} style={{ marginTop: 14 }}>
            <div className="img-slot-head"><strong>Card image</strong><small>JPG, PNG or WEBP, max 2 MB. Landscape works best.</small></div>
            <div className="img-preview" style={{ height: 120 }}>
              {preview ? <img src={preview} alt="Service" /> : <span><Icon.image width={24} height={24} />No image</span>}
            </div>
            {errors.image && <div className="msg">{errors.image}</div>}
            <div className="img-actions">
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden
                     onChange={(e) => e.target.files[0] && setImg({ file: e.target.files[0], removed: false })} />
              <button type="button" className="adm-btn sm ghost" onClick={() => fileInput.current.click()}>{preview ? 'Replace' : 'Upload'}</button>
              {preview && <button type="button" className="adm-btn sm ghost danger" onClick={() => { fileInput.current.value = ''; setImg({ file: null, removed: true }) }}>Remove</button>}
            </div>
          </div>
          {text('category', 'Small label (shown after the number)', { placeholder: 'Brand identity', autoFocus: true })}
          {text('title', 'Title', { placeholder: 'Trademark Registration' })}
          <div className={'fld' + (errors.description ? ' bad' : '')}>
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="4" value={f.description} onChange={set('description')} />
            {errors.description && <div className="msg">{errors.description}</div>}
          </div>
          <div className={'fld' + (errors.features ? ' bad' : '')}>
            <label>Pop-up tick list</label>
            <div className="hint" style={{ marginBottom: 8 }}>Shown in the pop-up that opens when a visitor clicks the card's button. Up to 8 points.</div>
            {features.map((x, i) => (
              <div className="list-row" key={i}>
                <span className="list-no">{i + 1}</span>
                <input type="text" value={x} onChange={(e) => setFeatures(features.map((y, j) => (j === i ? e.target.value : y)))} />
                <button type="button" className="row-btn danger" title="Remove" onClick={() => setFeatures(features.filter((_, j) => j !== i))}><Icon.trash /></button>
              </div>
            ))}
            {errors.features && <div className="msg">{errors.features}</div>}
            {features.length < 8 && <button type="button" className="adm-btn sm ghost" onClick={() => setFeatures([...features, ''])}><Icon.plus width={15} height={15} /> Add point</button>}
          </div>
          <div className="grid2">
            {text('button_label', 'Card button label')}
            {text('button_url', 'Pop-up "Enquire" button link', { placeholder: '#contact' })}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Order</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position ? <div className="msg">{errors.position}</div> : <div className="hint">1 = first card.</div>}
          </div>
          <label className="chk"><input type="checkbox" checked={f.is_wide} onChange={set('is_wide')} /> Display as a wide card (full-width banner, image on the left)</label>
          <label className="chk"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Active (visible on the website)</label>
          <div className="modal-foot">
            <button type="button" className="adm-btn sm ghost" onClick={onClose}>Cancel</button>
            <button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function IPServices() {
  const toast = useToast()
  const [section, setSection] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => adminApi.ipServices.list().then((r) => { setSection(r.section); setItems(r.services) }).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])
  const setS = (k) => (e) => setSection({ ...section, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function saveSection(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    fd.append('action', 'section')
    ;['eyebrow', 'heading_plain', 'heading_gold', 'description', 'popup_label', 'popup_button_label'].forEach((k) => fd.append(k, section[k] ?? ''))
    if (section.show_section) fd.append('show_section', '1')
    try { const r = await adminApi.ipServices.saveSection(fd); setSection(r.section); toast.success('Section heading saved successfully') }
    catch (err) { setErrors(err.errors || {}); toast.error(err.message) }
    finally { setBusy(false) }
  }

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) } }
  const remove = (s) => window.confirm(`Delete "${s.title}"?`) && run(() => adminApi.ipServices.remove(s.id), 'Service deleted')

  if (!section) return <div className="muted">Loading...</div>

  const text = (k, label, extra = {}) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={section[k]} onChange={setS(k)} {...extra} />
      {errors[k] && <div className="msg">{errors[k]}</div>}
    </div>
  )

  return (
    <>
      <div className="page-head"><h1>IP Services</h1></div>

      <form onSubmit={saveSection} noValidate>
        <section className="card">
          <div className="card-head"><h3>Section heading</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={section.show_section} onChange={setS('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 480 } })}
            <div className="grid2">
              {text('heading_plain', 'Heading (navy)', { placeholder: 'Protect your brand, creations' })}
              {text('heading_gold', 'Heading continued (gold)', { placeholder: 'and innovations.' })}
            </div>
            <div className={'fld' + (errors.description ? ' bad' : '')}>
              <label htmlFor="sdesc">Description</label>
              <textarea id="sdesc" rows="3" value={section.description} onChange={setS('description')} />
              {errors.description && <div className="msg">{errors.description}</div>}
            </div>
            <div className="grid2">
              {text('popup_label', 'Pop-up small heading', { placeholder: 'JBM Service Overview' })}
              {text('popup_button_label', 'Pop-up button label', { placeholder: 'Enquire about this service' })}
            </div>
            <div className="form-bar" style={{ marginTop: 16 }}><button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save heading'}</button></div>
          </div>
        </section>
      </form>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-head row">
          <h3>Service cards ({items.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add service</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Order</th><th>Service</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && !items.length && <tr><td colSpan="4" className="muted" style={{ textAlign: 'center', padding: 36 }}>No services yet. Click "Add service".</td></tr>}
              {items.map((s, i) => (
                <tr key={s.id}>
                  <td><OrderInput value={i + 1} max={items.length} onCommit={(pos) => run(() => adminApi.ipServices.reorder(s.id, pos), 'Order updated')} /></td>
                  <td>
                    <div className="u-cell">
                      <span className="thumb">{s.image_url ? <img src={s.image_url} alt="" /> : <Icon.image width={18} height={18} />}</span>
                      <div><strong>{s.title}</strong>{s.is_wide && <span className="badge you">Wide</span>}<div className="muted">{s.category}</div></div>
                    </div>
                  </td>
                  <td><span className={'badge ' + (s.is_active ? 'on' : 'off')}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (s.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.ipServices.toggle(s.id), s.is_active ? 'Service deactivated' : 'Service activated')}>
                      {s.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...s, position: i + 1 })}><Icon.edit /></button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(s)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <ServiceModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
