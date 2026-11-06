import { createContext, useContext } from 'react'

// Opens legal pages as a popup and smooth-scrolls to on-page sections.
export const LegalContext = createContext({ open: () => {} })
export const useLegal = () => useContext(LegalContext)

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return false
  const header = document.querySelector('.site-header')
  const offset = header ? header.offsetHeight : 0
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset + 1, behavior: 'smooth' })
  history.replaceState(null, '', '#' + id)
  return true
}

export default function SiteLink({ href, newTab, children, className, onClick, ...rest }) {
  const legal = useLegal()
  const url = href || '#'

  function handle(e) {
    if (url.startsWith('#legal:')) {
      e.preventDefault()
      legal.open(url.slice(7))
    } else if (url.startsWith('#') && url.length > 1) {
      if (scrollToId(url.slice(1))) e.preventDefault()
    }
    onClick?.(e)
  }

  const external = /^https?:\/\//i.test(url)
  return (
    <a href={url} className={className} onClick={handle}
       {...(newTab || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}
