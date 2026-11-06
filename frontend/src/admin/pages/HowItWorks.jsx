import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'

const ICONS = [
  ['pointer', 'Hand / select'], ['document', 'Document'], ['review', 'Document review'], ['handshake', 'Handshake'],
  ['shield', 'Shield'], ['bolt', 'Lightning'], ['users', 'People'], ['lightbulb', 'Idea'], ['chat', 'Chat'], ['check', 'Tick'],
]
const iconLabel = (v) => (ICONS.find(([k]) => k === v) || [])[1] || v
const empty = { id: 0, title: '', description: '', icon: 'check', is_active: true, position: '' }

function StepModal({ initial, onClose, onSaved }) {
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
      await adminApi.how.save({ ...f, action: 'step' })
      onSaved(editing ? 'Step updated' : 'Step created')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{editing ? 'Edit step' : 'Add step'}</h3>
        <form onSubmit={submit} noValidate>
          <div className={'fld' + (errors.icon ? ' bad' : '')}>
            <label htmlFor="icon">Icon</label>
            <select id="icon" value={f.icon} onChange={set('icon')}>
              {ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {errors.icon && <div className="msg">{errors.icon}</div>}
          </div>
          <div className={'fld' + (errors.title ? ' bad' : '')}>
            <label htmlFor="title">Title</label>
            <input id="title" type="text" autoFocus value={f.title} onChange={set('title')} placeholder="Choose a service" />
            {errors.title && <div className="msg">{errors.title}</div>}
          </div>
          <div className={'fld' + (errors.description ? ' bad' : '')}>
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="4" value={f.description} onChange={set('description')} />
            {errors.description && <div className="msg">{errors.description}</div>}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Step number</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position ? <div className="msg">{errors.position}</div> : <div className="hint">Shown as 01, 02, 03...</div>}
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

export default function HowItWorks() {
  const toast = useToast()
  const [section, setSection] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => adminApi.how.list().then((r) => { setSection(r.section); setSteps(r.steps) }).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])
  const setS = (k) => (e) => setSection({ ...section, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function saveSection(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try { const r = await adminApi.how.save({ ...section, action: 'section' }); setSection(r.section); toast.success('Section heading saved successfully') }
    catch (err) { setErrors(err.errors || {}); toast.error(err.message) }
    finally { setBusy(false) }
  }

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) } }
  const remove = (s) => window.confirm(`Delete "${s.title}"?`) && run(() => adminApi.how.remove(s.id), 'Step deleted')

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
      <div className="page-head"><h1>How It Works</h1></div>

      <form onSubmit={saveSection} noValidate>
        <section className="card">
          <div className="card-head"><h3>Section heading</h3></div>
          <div className="card-body">
            <label className="chk" style={{ marginTop: 0 }}><input type="checkbox" checked={section.show_section} onChange={setS('show_section')} /> Show this section on the website</label>
            {text('eyebrow', 'Small line above the heading', { style: { maxWidth: 480 } })}
            <div className="grid2">
              {text('heading_before', 'Heading (navy)', { placeholder: 'From requirement' })}
              {text('heading_gold', 'Heading continued (gold)', { placeholder: 'to result.' })}
            </div>
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
          <h3>Steps ({steps.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add step</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Step no.</th><th>Step</th><th>Icon</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
              {!loading && !steps.length && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 36 }}>No steps yet. Click "Add step".</td></tr>}
              {steps.map((s, i) => (
                <tr key={s.id}>
                  <td><OrderInput value={i + 1} max={steps.length} onCommit={(pos) => run(() => adminApi.how.reorder(s.id, pos), 'Order updated')} /></td>
                  <td><strong>{s.title}</strong><div className="muted enq-prev">{s.description}</div></td>
                  <td className="muted">{iconLabel(s.icon)}</td>
                  <td><span className={'badge ' + (s.is_active ? 'on' : 'off')}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (s.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.how.toggle(s.id), s.is_active ? 'Step deactivated' : 'Step activated')}>
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

      {modal && <StepModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
