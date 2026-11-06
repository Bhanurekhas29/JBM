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
  const [confirmOut, setConfirmOut] = useState(false)   // "Sign out?" dialog
  const [signingOut, setSigningOut] = useState(false)
  const askLogout = () => { setUserMenu(false); setConfirmOut(true) }
  const doLogout = async () => { setSigningOut(true); try { await logout() } finally { setSigningOut(false); setConfirmOut(false) } }
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

          <button className="notif-btn logout-btn" title="Sign out" aria-label="Sign out" onClick={askLogout}><Icon.logout /></button>

          <div className="user-dd" ref={ref}>
            <button className={'user-btn' + (userMenu ? ' open' : '')} aria-haspopup="menu" aria-expanded={userMenu} onClick={() => setUserMenu((o) => !o)}>
              <span className="avatar sm">{user.username[0].toUpperCase()}</span>
              <span className="uname">{user.username}</span>
              <Icon.chevronDown className="user-caret" width={16} height={16} />
            </button>
            {userMenu && (
              <div className="dd-panel">
                <div className="dd-head"><strong>{user.username}</strong><small>Administrator</small></div>
                <button className="dd-item" onClick={askLogout}><Icon.logout /> Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="content"><Outlet /></main>
        {confirmOut && (
          <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && !signingOut && setConfirmOut(false)}
               onKeyDown={(e) => e.key === 'Escape' && !signingOut && setConfirmOut(false)}>
            <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="out-title" style={{ maxWidth: 400 }}>
              <h3 id="out-title">Sign out?</h3>
              <div style={{ padding: '10px 24px 22px' }}>
                <p className="muted" style={{ margin: 0 }}>You will need to sign in again to manage the website.</p>
                <div className="modal-foot">
                  <button className="adm-btn sm ghost" onClick={() => setConfirmOut(false)} disabled={signingOut} autoFocus>Stay signed in</button>
                  <button className="adm-btn sm" onClick={doLogout} disabled={signingOut}>{signingOut ? 'Signing out...' : 'Yes, sign out'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <footer className="adm-footer">&copy; {new Date().getFullYear()} JBM. All rights reserved.</footer>
      </div>
    </div>
  )
}
