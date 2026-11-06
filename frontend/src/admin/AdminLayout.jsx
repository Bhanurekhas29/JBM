import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { menu } from './menu.js'
import { Icon } from './icons.jsx'
import { ADMIN_LOGO } from './adminAssets.js'
import NotificationBell from './NotificationBell.jsx'

function SidebarItem({ item, onNavigate }) {
  const I = Icon[item.icon] || Icon.menu
  if (item.external) {
    return (
      <a className="sb-link" href={item.to} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
        <I /><span>{item.label}</span><Icon.external className="sb-ext" width={14} height={14} />
      </a>
    )
  }
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => 'sb-link' + (isActive ? ' active' : '')} onClick={onNavigate}>
      <I /><span>{item.label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)      // mobile drawer
  const [userMenu, setUserMenu] = useState(false)
  const [logoOk, setLogoOk] = useState(true)
  const ref = useRef(null)
  const loc = useLocation()

  // Breadcrumb trail from the menu config: [group header?, item label]
  const trail = []
  for (const g of menu) {
    const it = g.items.find((i) => !i.external && (i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)))
    if (it) { if (g.header) trail.push(g.header); trail.push(it.label); break }
  }

  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setUserMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className={'adm-shell' + (open ? ' sb-open' : '')}>
      <aside className="sidebar">
        <div className="sb-brand">
          {logoOk && <img className="sb-logo-img" src={ADMIN_LOGO} alt="JBM logo" onError={() => setLogoOk(false)} />}
          <span className="sb-logo">JBM</span><small>Admin</small>
        </div>

        <div className="sb-user">
          <span className="avatar">{user.username[0].toUpperCase()}</span>
          <div><strong>{user.username}</strong><small>Administrator</small></div>
        </div>

        <nav className="sb-nav">
          {menu.map((group, i) => (
            <div key={i} className="sb-group">
              {group.header && <div className="sb-header">{group.header}</div>}
              {group.items.map((it) => <SidebarItem key={it.label} item={it} onNavigate={() => setOpen(false)} />)}
            </div>
          ))}
        </nav>
      </aside>
      <div className="sb-overlay" onClick={() => setOpen(false)} />

      <div className="adm-main">
        <header className="topbar">
          <button className="icon-btn" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}><Icon.menu /></button>
          <nav className="top-path" aria-label="Breadcrumb">
            <span>Home</span>
            {trail.map((t, i) => (
              <span key={i} className="tp-seg"><i>/</i>{i === trail.length - 1 ? <b>{t}</b> : t}</span>
            ))}
          </nav>

          <NotificationBell />

          <div className="user-dd" ref={ref}>
            <button className="user-btn" onClick={() => setUserMenu((o) => !o)}>
              <span className="avatar sm">{user.username[0].toUpperCase()}</span>
              <span className="uname">{user.username}</span>
            </button>
            {userMenu && (
              <div className="dd-panel">
                <div className="dd-head"><strong>{user.username}</strong><small>Administrator</small></div>
                <button className="dd-item" onClick={logout}><Icon.logout /> Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="content"><Outlet /></main>
        <footer className="adm-footer">&copy; {new Date().getFullYear()} JBM. All rights reserved.</footer>
      </div>
    </div>
  )
}
