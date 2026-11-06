import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'
import LegalContent from '../../components/LegalContent.jsx'

const empty = { id: 0, title: '', slug: '', content: '', is_active: false, position: '' }

function PreviewModal({ page, onClose }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 680 }}>
        <h3>{page.title || 'Untitled'}</h3>
        <div style={{ padding: '4px 24px 8px' }}>
          <LegalContent text={page.content} />
          {!page.content?.trim() && <p className="muted">No content yet.</p>}
        </div>
        <div className="modal-foot" style={{ padding: '0 24px 22px' }}><button className="adm-btn sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}

function PageModal({ initial, onClose, onSaved }) {
  const toast = useToast()
  const editing = !!initial.id
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors({})
    try {
      await adminApi.legal.save(f)
      onSaved(editing ? 'Page updated' : 'Page created')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 720 }}>
        <h3>{editing ? 'Edit page' : 'Add page'}</h3>
        <form onSubmit={submit} noValidate>
          <div className="grid2">
            <div className={'fld' + (errors.title ? ' bad' : '')}>
              <label htmlFor="title">Title</label>
              <input id="title" type="text" autoFocus value={f.title} onChange={set('title')} placeholder="Privacy Policy" />
              {errors.title && <div className="msg">{errors.title}</div>}
            </div>
            <div className={'fld' + (errors.slug ? ' bad' : '')}>
              <label htmlFor="slug">Link name</label>
              <input id="slug" type="text" value={f.slug} onChange={set('slug')} placeholder="privacy-policy" />
              {errors.slug ? <div className="msg">{errors.slug}</div> : <div className="hint">Used in the footer link. Leave blank to create it from the title.</div>}
            </div>
          </div>
          <div className={'fld' + (errors.content ? ' bad' : '')}>
            <label htmlFor="content">Content</label>
            <textarea id="content" rows="14" value={f.content} onChange={set('content')} />
            {errors.content ? <div className="msg">{errors.content}</div> : (
              <div className="hint">Leave a blank line between paragraphs. Start a line with <b>## </b> for a heading or <b>- </b> for a bullet. Use <b>**text**</b> for bold.</div>
            )}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Order</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position && <div className="msg">{errors.position}</div>}
          </div>
          <label className="chk"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Active (available on the website)</label>
          <div className="modal-foot">
            <button type="button" className="adm-btn sm ghost" onClick={() => setPreview(true)}>Preview</button>
            <button type="button" className="adm-btn sm ghost" onClick={onClose}>Cancel</button>
            <button className="adm-btn sm" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
      {preview && <PreviewModal page={f} onClose={() => setPreview(false)} />}
    </div>
  )
}

export default function LegalPages() {
  const toast = useToast()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => adminApi.legal.list().then((r) => setPages(r.pages)).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])

  const run = async (fn, okMsg) => { try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) } }
  const remove = (p) => window.confirm(`Delete "${p.title}"? This cannot be undone.`) && run(() => adminApi.legal.remove(p.id), 'Page deleted')

  return (
    <>
      <div className="page-head"><h1>Legal Pages</h1></div>

      <section className="card">
        <div className="card-head row">
          <h3>Pages ({pages.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add page</button>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="hint" style={{ color: '#8a93a3', fontSize: '.82rem' }}>
            On the website these open as a pop-up when a visitor clicks the link. In the <b>Footer</b> page, point a link to <b>#legal:link-name</b> (for example <b>#legal:privacy-policy</b>).
          </div>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Order</th><th>Page</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && !pages.length && <tr><td colSpan="4" className="muted" style={{ textAlign: 'center', padding: 36 }}>No pages yet. Click "Add page".</td></tr>}
              {pages.map((p, i) => (
                <tr key={p.id}>
                  <td><OrderInput value={i + 1} max={pages.length} onCommit={(pos) => run(() => adminApi.legal.reorder(p.id, pos), 'Order updated')} /></td>
                  <td>
                    <strong>{p.title}</strong>
                    <div className="muted">#legal:{p.slug}</div>
                    {!p.content.trim() && <span className="badge warn">Needs content</span>}
                  </td>
                  <td><span className={'badge ' + (p.is_active ? 'on' : 'off')}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (p.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.legal.toggle(p.id), p.is_active ? 'Page deactivated' : 'Page activated')}>
                      {p.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...p, position: i + 1 })}><Icon.edit /></button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(p)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <PageModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
