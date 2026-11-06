import { useEffect, useState, useCallback, useRef } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'

const empty = { id: 0, question: '', answer: '', is_active: true, position: '' }

function FaqModal({ initial, onClose, onSaved }) {
  const toast = useToast()
  const editing = !!initial.id
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      await adminApi.faq.saveItem(f)
      onSaved(editing ? 'Question updated' : 'Question created')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 540 }}>
        <h3>{editing ? 'Edit question' : 'Add question'}</h3>
        <form onSubmit={submit} noValidate>
          <div className={'fld' + (errors.question ? ' bad' : '')}>
            <label htmlFor="question">Question</label>
            <input id="question" type="text" autoFocus value={f.question} onChange={set('question')} />
            {errors.question && <div className="msg">{errors.question}</div>}
          </div>
          <div className={'fld' + (errors.answer ? ' bad' : '')}>
            <label htmlFor="answer">Answer</label>
            <textarea id="answer" rows="6" value={f.answer} onChange={set('answer')} />
            {errors.answer && <div className="msg">{errors.answer}</div>}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Order</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position ? <div className="msg">{errors.position}</div> : <div className="hint">1 = first question.</div>}
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

export default function Faqs() {
  const toast = useToast()
  const fileInput = useRef(null)
  const [section, setSection] = useState(null)
  const [items, setItems] = useState([])
  const [img, setImg] = useState({ file: null, removed: false })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => adminApi.faq.list().then((r) => { setSection(r.section); setItems(r.items) }).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])
  const setS = (k) => (e) => setSection({ ...section, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function saveSection(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    fd.append('action', 'section')
    ;['eyebrow', 'heading_before', 'heading_gold'].forEach((k) => fd.append(k, section[k]))
    if (section.show_section) fd.append('show_section', '1')
    if (img.file) fd.append('image', img.file)
    else if (img.removed) fd.append('remove_image', '1')
    try { const r = await adminApi.faq.saveSection(fd); setSection(r.section); setImg({ file: null, removed: false }); toast.success('FAQ heading saved successfully') }
    catch (err) { setErrors(err.errors || {}); toast.error(err.message) }
    finally { setBusy(false) }
  }

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) } }
  const remove = (q) => window.confirm(`Delete this question?\n\n${q.question}`) && run(() => adminApi.faq.remove(q.id), 'Question deleted')

  if (!section) return <div className="muted">Loading...</div>

  const text = (k, label, extra = {}) => (
    <div className={'fld' + (errors[k] ? ' bad' : '')}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={section[k]} onChange={setS(k)} {...extra} />
      {errors[k] && <div className="msg">{errors[k]}</div>}
    </div>
  )
  const preview = img.file ? URL.createObjectURL(img.file) : img.removed ? '' : section.image_url

  return (
    <>
      <div className="page-head"><h1>FAQs</h1></div>

      <form onSubmit={saveSection} noValidate>
        <section className="card">
          <div className="card-head"><h3>Section heading &amp; image</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={section.show_section} onChange={setS('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 320 } })}
            <div className="grid2">
              {text('heading_before', 'Heading (navy)', { placeholder: 'Answers before you' })}
              {text('heading_gold', 'Heading continued (gold)', { placeholder: 'begin.' })}
            </div>
            <div className={'img-slot' + (errors.image ? ' bad' : '')} style={{ maxWidth: 420, marginTop: 16 }}>
              <div className="img-slot-head"><strong>Side image</strong><small>Shown under the heading. PNG, JPG or WEBP, max 2 MB.</small></div>
              <div className="img-preview" style={{ height: 160 }}>
                {preview ? <img src={preview} alt="FAQ" /> : <span><Icon.image width={26} height={26} />No image</span>}
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
            <div className="form-bar" style={{ marginTop: 16 }}><button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save heading & image'}</button></div>
          </div>
        </section>
      </form>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-head row">
          <h3>Questions ({items.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add question</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Order</th><th>Question</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && !items.length && <tr><td colSpan="4" className="muted" style={{ textAlign: 'center', padding: 36 }}>No questions yet. Click "Add question".</td></tr>}
              {items.map((q, i) => (
                <tr key={q.id}>
                  <td><OrderInput value={i + 1} max={items.length} onCommit={(pos) => run(() => adminApi.faq.reorder(q.id, pos), 'Order updated')} /></td>
                  <td>
                    <strong>{q.question}</strong>
                    {q.answer ? <div className="muted enq-prev">{q.answer}</div> : <div><span className="badge warn">Needs an answer</span></div>}
                  </td>
                  <td><span className={'badge ' + (q.is_active ? 'on' : 'off')}>{q.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (q.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.faq.toggle(q.id), q.is_active ? 'Question deactivated' : 'Question activated')}>
                      {q.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...q, position: i + 1 })}><Icon.edit /></button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(q)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <FaqModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
