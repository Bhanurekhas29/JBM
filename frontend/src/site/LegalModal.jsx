import { useEffect, useRef } from 'react'
import LegalContent from '../components/LegalContent.jsx'
import Icon from './icons.jsx'

// Pop-up for the legal pages (Privacy Policy, Terms...). `slug` null = closed.
export default function LegalModal({ slug, pages, onClose }) {
  const panel = useRef(null)
  const page = slug ? (pages || []).find((p) => p.slug === slug) : null

  useEffect(() => {
    if (!slug) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [slug, onClose])

  if (!slug) return null

  return (
    <div className="legal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="legal-panel" role="dialog" aria-modal="true" aria-labelledby="legal-title" tabIndex={-1} ref={panel}>
        <header className="legal-head">
          <h2 id="legal-title">{page ? page.title : 'Page not available'}</h2>
          <button className="legal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </header>
        <div className="legal-body">
          {page
            ? <LegalContent text={page.content} />
            : <p className="legal-empty">This page will be available soon. Please contact us if you need this information.</p>}
        </div>
        <footer className="legal-foot"><button className="btn btn-navy" onClick={onClose}>Close</button></footer>
      </div>
    </div>
  )
}
