import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

const paragraphs = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

export default function Approach({ approach }) {
  if (!approach || !approach.show_section) return null
  const a = approach

  return (
    <section id="about" className="section approach">
      <div className="container approach-grid">
        <div className="approach-media" data-reveal="left">
          <div className="approach-frame" aria-hidden="true" />
          {a.image_url
            ? <img src={a.image_url} alt={a.heading_before} loading="lazy" />
            : <span className="svc-noimg approach-noimg" />}
          {a.image_caption && <div className="approach-caption">{a.image_caption}</div>}
        </div>

        <div className="approach-copy" data-reveal="right">
          {a.eyebrow && <div className="eyebrow eyebrow-left"><span className="line" />{a.eyebrow}</div>}
          <h2 className="sec-title approach-title">{a.heading_before} {a.heading_gold && <span className="gold-text">{a.heading_gold}</span>}</h2>
          {paragraphs(a.description).map((p, i) => <p key={i} className="approach-text">{p}</p>)}

          {a.features.length > 0 && (
            <ul className="approach-features">
              {a.features.map((f, i) => (
                <li key={i} data-reveal="up" style={{ '--i': i + 2 }}>
                  <span className="af-icon"><Icon name={f.icon} size={20} /></span>
                  <strong>{f.title}</strong>
                  {f.text && <span>{f.text}</span>}
                </li>
              ))}
            </ul>
          )}

          {a.button_label && (
            <SiteLink href={a.button_url} newTab={a.button_new_tab} className="btn btn-outline-navy">
              {a.button_label} <Icon name="arrowRight" size={15} />
            </SiteLink>
          )}
        </div>
      </div>
    </section>
  )
}
