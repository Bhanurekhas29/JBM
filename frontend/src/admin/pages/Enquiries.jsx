import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'
import { useToast } from '../Toast.jsx'

function fmt(d) {
  const dt = new Date(String(d).replace(' ', 'T'))
  return isNaN(dt) ? d : dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function ViewModal({ item, onClose, onToggle, onDelete }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 560 }}>
        <h3>Enquiry from {item.name}</h3>
        <div style={{ padding: '10px 24px 22px' }}>
          <dl className="enq-detail">
            <dt>Received</dt><dd>{fmt(item.created_at)}</dd>
            <dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd>
            {item.organization && <><dt>Business</dt><dd>{item.organization}</dd></>}
            {item.phone && <><dt>Phone</dt><dd><a href={`tel:${item.phone}`}>{item.phone}</a></dd></>}
            {item.service && <><dt>Service</dt><dd>{item.service}</dd></>}
            <dt>Message</dt><dd className="enq-msg">{item.message}</dd>
          </dl>
          <div className="modal-foot">
            <button className="adm-btn sm ghost danger" onClick={() => onDelete(item)}>Delete</button>
            <button className="adm-btn sm ghost" onClick={() => onToggle(item, false)}>Mark as unread</button>
            <button className="adm-btn sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Enquiries() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [viewing, setViewing] = useState(null)

  const load = useCallback(() => adminApi.enquiries.list().then((r) => { setItems(r.enquiries); setUnread(r.unread) }).finally(() => setLoading(false)), [])
  useEffect(() => { load() }, [load])

  async function setRead(e, isRead, quiet) {
    try { await adminApi.enquiries.setRead(e.id, isRead); if (!quiet) toast.success(isRead ? 'Marked as read' : 'Marked as unread'); load() } catch (err) { toast.error(err.message) }
  }
  async function remove(e) {
    if (!window.confirm(`Delete the enquiry from ${e.name}? This cannot be undone.`)) return
    try { await adminApi.enquiries.remove(e.id); setViewing(null); toast.success('Enquiry deleted'); load() } catch (err) { toast.error(err.message) }
  }
  function open(e) {
    setViewing(e)
    if (!e.is_read) setRead(e, true, true)
  }

  const shown = tab === 'new' ? items.filter((i) => !i.is_read) : items

  return (
    <>
      <div className="page-head"><h1>Enquiries</h1></div>

      <section className="card">
        <div className="card-head row">
          <h3>All enquiries ({items.length})</h3>
          <div className="tabs">
            <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All</button>
            <button className={tab === 'new' ? 'on' : ''} onClick={() => setTab('new')}>New{unread > 0 && <span className="count">{unread}</span>}</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Received</th><th>Name</th><th>Contact</th><th>Message</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="muted">Loading...</td></tr>}
              {!loading && !shown.length && <tr><td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 40 }}>{tab === 'new' ? 'No new enquiries.' : 'No enquiries yet. Submissions from the website enquiry form will appear here.'}</td></tr>}
              {shown.map((e) => (
                <tr key={e.id} className={e.is_read ? '' : 'unread'} onClick={() => open(e)} style={{ cursor: 'pointer' }}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmt(e.created_at)}</td>
                  <td><strong>{e.name}</strong>{e.organization && <div className="muted">{e.organization}</div>}{e.service && <div className="muted">{e.service}</div>}</td>
                  <td>{e.email}{e.phone && <div className="muted">{e.phone}</div>}</td>
                  <td className="muted enq-prev">{e.message}</td>
                  <td><span className={'badge ' + (e.is_read ? 'off' : 'on')}>{e.is_read ? 'Read' : 'New'}</span></td>
                  <td className="actions" onClick={(ev) => ev.stopPropagation()}>
                    <button className="row-btn" title={e.is_read ? 'Mark as unread' : 'Mark as read'} onClick={() => setRead(e, !e.is_read)}>{e.is_read ? <Icon.mail /> : <Icon.check />}</button>
                    <button className="row-btn danger" title="Delete" onClick={() => remove(e)}><Icon.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && <ViewModal item={viewing} onClose={() => setViewing(null)}
        onToggle={(e, v) => { setRead(e, v); setViewing(null) }} onDelete={remove} />}
    </>
  )
}
