import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

const SOCIAL = [['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['x', 'X']]

export default function Footer({ brand, footer }) {
  if (!footer) return null
  const b = brand || {}
  const f = footer
  const year = new Date().getFullYear()
  const socials = SOCIAL.filter(([k]) => f.socials?.[k])

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand" data-reveal="up">
            <div className="brand-lockup footer-lockup">
              {b.footer_logo_url && <img src={b.footer_logo_url} alt={b.website_name || 'Logo'} loading="lazy" />}
              <span className="brand-text">
                {b.company_name && <strong className="brand-name">{b.company_name}</strong>}
                {b.company_descriptor && <span className="brand-desc">{b.company_descriptor}</span>}
                {b.tagline && <span className="brand-tag">{b.tagline}</span>}
              </span>
            </div>
            {f.about_text && <p className="footer-about">{f.about_text}</p>}
            {socials.length > 0 && (
              <div className="footer-social">
                {socials.map(([k, label]) => (
                  <a key={k} href={f.socials[k]} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon name={k} size={17} /></a>
                ))}
              </div>
            )}
          </div>

          {f.columns.map((col, i) => (
            <nav className={'footer-col' + (col.links.length <= 4 ? ' few' : '')} key={i} aria-label={col.title} data-reveal="up" style={{ '--i': i + 1 }}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l, j) => <li key={j}><SiteLink href={l.url}>{l.label}</SiteLink></li>)}
              </ul>
            </nav>
          ))}

          {(f.phone || f.email || f.address || f.office_hours) && (
            <div className="footer-col footer-contact" data-reveal="up" style={{ '--i': f.columns.length + 1 }}>
              <h4>Contact</h4>
              <ul>
                {f.phone && <li><Icon name="phone" size={16} /><span>Call: <a href={`tel:${f.phone.replace(/[^\d+]/g, '')}`}>{f.phone}</a></span></li>}
                {f.email && <li><Icon name="mail" size={16} /><span>Email: <a href={`mailto:${f.email}`}>{f.email}</a></span></li>}
                {f.address && <li><Icon name="mapPin" size={16} /><span>Address: {f.address}</span></li>}
                {f.office_hours && <li><Icon name="clock" size={16} /><span>Office hours: {f.office_hours}</span></li>}
              </ul>
            </div>
          )}
        </div>

        {f.bottom_tagline && <p className="footer-tagline" data-reveal="up">{f.bottom_tagline}</p>}
        {(f.copyright_text || b.show_credits) && (
          <div className="footer-bottom">
            {f.copyright_text && <p className="footer-copy">{f.copyright_text.replace(/\{year\}/g, year)}</p>}
            {b.show_credits && (
              <p className="footer-credit">
                Designed &amp; Developed by{' '}
                {b.credits_url
                  ? <a href={b.credits_url} target="_blank" rel="noopener noreferrer">Vetri IT Systems</a>
                  : 'Vetri IT Systems'}
              </p>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
