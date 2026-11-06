import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from './api.js'
import { Icon } from './icons.jsx'

export const ENQUIRIES_CHANGED = 'jbm:enquiries-changed'

function ago(d) {
  const t = new Date(String(d).replace(' ', 'T'))
  if (isNaN(t)) return ''
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return t.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

// Bell in the top bar: shows how many enquiries are unread, refreshes every 30 seconds,
// and lists the latest new ones.
export default function NotificationBell() {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState([])
  const ref = useRef(null)

  const load = useCallback(() => {
    adminApi.enquiries.list().then((r) => {
      setUnread(r.unread)
      setLatest(r.enquiries.filter((e) => !e.is_read).slice(0, 5))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    window.addEventListener(ENQUIRIES_CHANGED, load)
    return () => { clearInterval(t); window.removeEventListener(ENQUIRIES_CHANGED, load) }
  }, [load])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const go = () => { setOpen(false); nav('/admin/enquiries') }

  return (
    <div className="notif" ref={ref}>
      <button className={'notif-btn' + (unread ? ' has' : '')} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} onClick={() => { setOpen((o) => !o); if (!open) load() }}>
        <Icon.bell />
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head"><strong>Notifications</strong>{unread > 0 && <span className="badge on">{unread} new</span>}</div>
          {latest.length === 0 && <div className="notif-empty"><Icon.bell width={26} height={26} />You're all caught up.<small>New enquiries will appear here.</small></div>}
          {latest.map((e) => (
            <button key={e.id} className="notif-item" onClick={go}>
              <span className="notif-dot" />
              <span className="notif-txt">
                <b>New enquiry from {e.name}</b>
                <small>{e.service || e.message}</small>
              </span>
              <em>{ago(e.created_at)}</em>
            </button>
          ))}
          <button className="notif-all" onClick={go}>View all enquiries</button>
        </div>
      )}
    </div>
  )
}
