import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'
import OrderInput from '../OrderInput.jsx'

const empty = { id: 0, label: '', url: '', is_active: true, new_tab: false, position: '' }

function MenuModal({ initial, onClose, onSaved }) {
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
      await (editing ? adminApi.menus.update(f) : adminApi.menus.create(f))
      onSaved(editing ? 'Menu item updated' : 'Menu item created')
    } catch (err) {
      setErrors(err.errors || {}); toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{editing ? 'Edit menu item' : 'Add menu item'}</h3>
        <form onSubmit={submit} noValidate>
          <div className={'fld' + (errors.label ? ' bad' : '')}>
            <label htmlFor="label">Label</label>
            <input id="label" type="text" autoFocus value={f.label} onChange={set('label')} placeholder="About Us" />
            {errors.label && <div className="msg">{errors.label}</div>}
          </div>
          <div className={'fld' + (errors.url ? ' bad' : '')}>
            <label htmlFor="url">Link</label>
            <input id="url" type="text" value={f.url} onChange={set('url')} placeholder="#about" />
            {errors.url ? <div className="msg">{errors.url}</div> : <div className="hint">For this single-page site use a section like <b>#about</b>.</div>}
          </div>
          <div className={'fld' + (errors.position ? ' bad' : '')} style={{ maxWidth: 160 }}>
            <label htmlFor="position">Order</label>
            <input id="position" type="number" min="1" value={f.position} onChange={set('position')} placeholder={editing ? '' : 'Last'} />
            {errors.position ? <div className="msg">{errors.position}</div> : <div className="hint">1 = first.{!editing && ' Leave blank to add at the end.'}</div>}
          </div>
          <label className="chk"><input type="checkbox" checked={f.new_tab} onChange={set('new_tab')} /> Open in a new tab</label>
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

export default function NavLinks() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => adminApi.menus.list().then((r) => setItems(r.menus)).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])

  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg); load() } catch (e) { toast.error(e.message) }
  }
  const remove = (m) => window.confirm(`Delete "${m.label}"?`) && run(() => adminApi.menus.remove(m.id), 'Menu item deleted')

  return (
    <>
      <section className="card">
        <div className="card-head row">
          <h3>Navigation links ({items.length})</h3>
          <button className="adm-btn sm" onClick={() => setModal({ ...empty })}><Icon.plus width={16} height={16} /> Add menu item</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th style={{ width: 100 }}>Order</th><th>Label</th><th>Link</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
              {!loading && !items.length && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 36 }}>No menu items yet. Click "Add menu item".</td></tr>}
              {items.map((m, i) => (
                <tr key={m.id}>
                  <td><OrderInput value={i + 1} max={items.length} onCommit={(pos) => run(() => adminApi.menus.reorder(m.id, pos), 'Order updated')} /></td>
                  <td><strong>{m.label}</strong>{m.new_tab && <span className="badge off" style={{ marginLeft: 8 }}>New tab</span>}</td>
                  <td className="muted">{m.url}</td>
                  <td><span className={'badge ' + (m.is_active ? 'on' : 'off')}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className={'row-btn tgl ' + (m.is_active ? 'off' : 'on')} onClick={() => run(() => adminApi.menus.toggle(m.id), m.is_active ? 'Menu item deactivated' : 'Menu item activated')}>
                      {m.is_active ? <><Icon.ban width={15} height={15} /> Deactivate</> : <><Icon.check width={15} height={15} /> Activate</>}
                    </button>
                    <button className="row-btn" title="Edit" onClick={() => setModal({ ...m, position: i + 1 })}><Icon.edit /></button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(m)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <MenuModal initial={modal} onClose={() => setModal(null)} onSaved={(m) => { setModal(null); toast.success(m); load() }} />}
    </>
  )
}
