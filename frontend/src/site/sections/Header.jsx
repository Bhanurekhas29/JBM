import { useEffect, useRef, useState } from 'react'
import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

// Scroll-spy: highlights the menu item whose section is currently being read.
// Uses scroll positions (no observers): the active section is the last one whose top has passed ~35% of the screen.
function useActiveSection(menus) {
  const ids = (menus || []).map((m) => m.url).filter((u) => u.startsWith('#') && u.length > 1 && !u.startsWith('#legal:')).map((u) => u.slice(1))
  const key = ids.join('|')
  const [active, setActive] = useState(ids[0] || '')

  useEffect(() => {
    if (!ids.length) return
    const update = () => {
      const line = window.innerHeight * 0.35
      const present = ids.filter((id) => document.getElementById(id))   // only sections that exist on the page
      if (!present.length) return
      let current = present[0]
      for (const id of present) {
        if (document.getElementById(id).getBoundingClientRect().top <= line) current = id
      }
      // at the very bottom of the page the last section wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = present[present.length - 1]
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return active
}

export default function Header({ brand, header, menus }) {
  const [open, setOpen] = useState(false)
  const active = useActiveSection(menus)
  const b = brand || {}
  const h = header || {}
  const items = menus || []
  const ref = useRef(null)

  // keep the mobile menu panel exactly below the header
  useEffect(() => {
    const set = () => ref.current && document.documentElement.style.setProperty('--hdr-h', ref.current.offsetHeight + 'px')
    set(); window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [h.show_topbar])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="site-header" ref={ref}>
      {h.show_topbar && (h.topbar_left || h.topbar_right) && (
        <div className="topbar-strip">
          <div className="container">
            <span className="tb-left">{h.topbar_left}</span>
            <span className="tb-right">{h.topbar_right}</span>
          </div>
        </div>
      )}

      <div className="header-main">
        <div className="container header-row">
          <SiteLink href="#home" className="brand-lockup" onClick={() => setOpen(false)}>
            {b.header_logo_url && <img src={b.header_logo_url} alt={b.website_name || 'Logo'} />}
            <span className="brand-text">
              {b.company_name && <strong className="brand-name">{b.company_name}</strong>}
              {b.company_descriptor && <span className="brand-desc">{b.company_descriptor}</span>}
              {b.tagline && <span className="brand-tag">{b.tagline}</span>}
            </span>
          </SiteLink>

          <nav className={'main-nav' + (open ? ' open' : '')} aria-label="Main">
            {items.map((m) => {
              const id = m.url.startsWith('#') ? m.url.slice(1) : null
              const isActive = id && id === active
              return (
                <SiteLink key={m.id} href={m.url} newTab={m.new_tab} className={'nav-link' + (isActive ? ' active' : '')}
                          aria-current={isActive ? 'true' : undefined} onClick={() => setOpen(false)}>
                  {m.label}
                </SiteLink>
              )
            })}
            {h.show_cta && h.cta_label && (
              <SiteLink href={h.cta_url} newTab={h.cta_new_tab} className="btn btn-navy nav-cta" onClick={() => setOpen(false)}>
                {h.cta_label} <Icon name="arrowUpRight" size={15} />
              </SiteLink>
            )}
          </nav>

          <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>
    </header>
  )
}
