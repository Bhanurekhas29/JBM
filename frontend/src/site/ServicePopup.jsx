import { useEffect, useRef } from 'react'
import Icon from './icons.jsx'

// Pop-up that opens from a service card's "Explore" button.
export default function ServicePopup({ service, section, onClose, onEnquire }) {
  const panel = useRef(null)

  useEffect(() => {
    if (!service) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [service, onClose])

  if (!service) return null
  const words = service.title.trim().split(/\s+/)
  const last = words.pop()          // the last word of the title is shown in the accent colour
  const first = words.join(' ')

  return (
    <div className="sp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sp-panel" role="dialog" aria-modal="true" aria-labelledby="sp-title" tabIndex={-1} ref={panel}>
        <button className="sp-close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>

        <div className="sp-media">
          <span className="sp-crescent" aria-hidden="true" />
          {service.image_url ? <img src={service.image_url} alt={service.title} /> : <span className="sp-noimg" />}
        </div>

        <div className="sp-content">
          {section.popup_label && <div className="sp-eyebrow"><span className="line" />{section.popup_label}<span className="line" /></div>}
          <h2 id="sp-title">{first && <>{first} </>}<span className="terra">{last}</span></h2>
          {service.description && <p className="sp-desc">{service.description}</p>}

          {service.features.length > 0 && (
            <ul className="sp-features">
              {service.features.map((f, i) => (
                <li key={i}><span className="sp-tick"><Icon name="tick" size={17} /></span>{f}</li>
              ))}
            </ul>
          )}

          <div className="sp-actions">
            <button className="btn btn-terra" onClick={() => onEnquire(service)}>
              {section.popup_button_label || 'Enquire about this service'} <Icon name="arrowUpRight" size={15} />
            </button>
            <span className="sp-ornament" aria-hidden="true">
              <i />
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 1c.6 5.6 5.4 10.4 11 11-5.6.6-10.4 5.4-11 11-.6-5.6-5.4-10.4-11-11C6.6 11.4 11.4 6.6 12 1z" fill="#c9954a" /></svg>
              <i />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
