import { useEffect, useState, useCallback, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'

const empty = { id: 0, category: '', title: '', description: '', list_title: 'Our Services', items: [], image_url: '', button_label: '', button_url: '#contact', is_active: true, position: '' }

function CardModal({ initial, onClose, onSaved }) {
  const toast = useToast()
  const fileInput = useRef(null)
  const editing = !!initial.id
  const [f, setF] = useState(initial)
  const [items, setItems] = useState(initial.items)
  const [img, setImg] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : f.image_url

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    fd.append('action', 'card')
    if (editing) fd.append('id', f.id)
    ;['category', 'title', 'description', 'list_title', 'button_label', 'button_url', 'position'].forEach((k) => fd.append(k, f[k] ?? ''))
    fd.append('items', JSON.stringify(items))
    if (f.is_active) fd.append('is_active', '1')
    if (img.file) fd.append('image', img.file)
    else if (img.removed) fd.append('remove_image', '1')
    try {
      await adminApi.growth.saveCard(fd)
      onSaved(editing ? 'Card updated' : 'Card created')
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
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 540 }}>
        <h3>{editing ? 'Edit card' : 'Add card'}</h3>
        <form onSubmit={submit} noValidate>
          <div className={'img-slot' + (errors.image ? ' bad' : '')} style={{ marginTop: 14 }}>
            <div className="img-slot-head"><strong>Card image</strong><small>JPG, PNG or WEBP, max 2 MB. Shown on the left of the card.</small></div>
            <div className="img-preview dark" style={{ height: 120 }}>
              {preview ? <img src={preview} alt="Card" /> : <span><Icon.image width={24} height={24} />No image</span>}
            </div>
            {errors.image && <div className="msg">{errors.image}</div>}
            <div className="img-actions">
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden
                     onChange={(e) => e.target.files[0] && setImg({ file: e.target.files[0], removed: false })} />
              <button type="button" className="adm-btn sm ghost" onClick={() => fileInput.current.click()}>{preview ? 'Replace' : 'Upload'}</button>
              {preview && <button type="button" className="adm-btn sm ghost danger" onClick={() => { fileInput.current.value = ''; setImg({ file: null, removed: true }) }}>Remove</button>}
            </div>
          </div>
          {text('category', 'Small label', { placeholder: 'Digital Marketing', autoFocus: true })}
          {text('title', 'Title', { placeholder: 'Digital Marketing' })}
          <div className={'fld' + (errors.description ? ' bad' : '')}>
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="3" value={f.description} onChange={set('description')} />
            {errors.description && <div className="msg">{errors.description}</div>}
          </div>
          {text('list_title', 'Heading above the tick list', { placeholder: 'Our Services' })}
          <div className={'fld' + (errors.items ? ' bad' : '')}>
            <label>Tick list items</label>
            {items.map((it, i) => (
              <div className="list-row" key={i}>
                <span className="list-no">{i + 1}</span>
                <input type="text" value={it} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" className="row-btn danger" title="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon.trash /></button>
              </div>
            ))}
            {errors.items && <div className="msg">{errors.items}</div>}
            {items.length < 8 && <button type="button" className="adm-btn sm ghost" onClick={() => setItems([...items, ''])}><Icon.plus width={15} height={15} /> Add item</button>}
          </div>
          <div className="grid2">
            {text('button_label', 'Button label', { placeholder: 'Explore Digital Marketing' })}
            {text('button_url', 'Button link', { placeholder: '#contact' })}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Order</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position ? <div className="msg">{errors.position}</div> : <div className="hint">1 = first card.</div>}
          </div>
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

export default function Growth() {
  const toast = useToast()
  const [section, setSection] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => adminApi.growth.list().then((r) => { setSection(r.section); setCards(r.cards) }).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])
  const setS = (k) => (e) => setSection({ ...section, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function saveSection(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    fd.append('action', 'section')
    ;['eyebrow', 'heading_before', 'heading_gold', 'heading_after', 'description'].forEach((k) => fd.append(k, section[k]))
    if (section.show_section) fd.append('show_section', '1')
    try { const r = await adminApi.growth.saveSection(fd); setSection(r.section); toast.success('Section heading saved successfully') }
    catch (err) { setErrors(err.errors || {}); toast.error(err.message) }
    finally { setBusy(false) }
  }

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) } }
  const remove = (c) => window.confirm(`Delete "${c.title}"?`) && run(() => adminApi.growth.remove(c.id), 'Card deleted')

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
      <div className="page-head"><h1>Our Services</h1></div>

      <form onSubmit={saveSection} noValidate>
        <section className="card">
          <div className="card-head"><h3>Section heading</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={section.show_section} onChange={setS('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 480 } })}
            <div className="grid2">
              {text('heading_before', 'Heading, first part (white)', { placeholder: 'Give your business a' })}
              {text('heading_gold', 'Highlighted word(s) (gold)', { placeholder: 'stronger' })}
            </div>
            {text('heading_after', 'Heading, last part (white)', { placeholder: 'presence.', style: { maxWidth: 480 } })}
            <div className={'fld' + (errors.description ? ' bad' : '')}>
              <label htmlFor="sdesc">Description</label>
              <textarea id="sdesc" rows="3" value={section.description} onChange={setS('description')} />
              {errors.description && <div className="msg">{errors.description}</div>}
            </div>
            <div className="form-bar" style={{ marginTop: 16 }}><button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save heading'}</button></div>
          </div>
        </section>
      </form>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-head row">
          <h3>Cards ({cards.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add card</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Order</th><th>Card</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && !cards.length && <tr><td colSpan="4" className="muted" style={{ textAlign: 'center', padding: 36 }}>No cards yet. Click "Add card".</td></tr>}
              {cards.map((c, i) => (
                <tr key={c.id}>
                  <td><OrderInput value={i + 1} max={cards.length} onCommit={(pos) => run(() => adminApi.growth.reorder(c.id, pos), 'Order updated')} /></td>
                  <td>
                    <div className="u-cell">
                      <span className="thumb">{c.image_url ? <img src={c.image_url} alt="" /> : <Icon.image width={18} height={18} />}</span>
                      <div><strong>{c.title}</strong><div className="muted">{c.items.length} list items</div></div>
                    </div>
                  </td>
                  <td><span className={'badge ' + (c.is_active ? 'on' : 'off')}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (c.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.growth.toggle(c.id), c.is_active ? 'Card deactivated' : 'Card activated')}>
                      {c.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...c, position: i + 1 })}><Icon.edit /></button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(c)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <CardModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
