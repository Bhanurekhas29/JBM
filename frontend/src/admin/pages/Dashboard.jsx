import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { adminApi } from '../api.js'
import { Icon } from '../icons.jsx'

function fmt(d) {
  if (!d) return 'First login'
  const dt = new Date(String(d).replace(' ', 'T'))
  return isNaN(dt) ? d : dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(null)
  useEffect(() => { adminApi.enquiries.list().then((r) => setUnread(r.unread)).catch(() => {}) }, [])
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
      </div>

      <section className="welcome">
        <div>
          <h2>{greet}, {user.username}</h2>
          <p>Welcome to the JBM admin panel. Manage your website content from the menu on the left.</p>
        </div>
        <a className="adm-btn" href="/" target="_blank" rel="noopener noreferrer">View Website <Icon.external width={15} height={15} /></a>
      </section>

      <div className="stat-grid">
        <div className="stat"><span className="stat-ic"><Icon.user /></span><div><small>Signed in as</small><strong>{user.username}</strong></div></div>
        <div className="stat"><span className="stat-ic"><Icon.clock /></span><div><small>Previous login</small><strong>{fmt(user.last_login)}</strong></div></div>
        <Link className="stat" to="/admin/enquiries" style={{ textDecoration: 'none' }}><span className="stat-ic"><Icon.inbox /></span><div><small>New enquiries</small><strong>{unread === null ? '-' : unread}</strong></div></Link>
        <div className="stat"><span className="stat-ic"><Icon.server /></span><div><small>System status</small><strong className="ok">Online</strong></div></div>
      </div>

      <section className="card">
        <div className="card-head"><h3>Recent Activity</h3></div>
        <div className="card-body empty">No activity yet. Content sections will appear here as we add them.</div>
      </section>
    </>
  )
}
