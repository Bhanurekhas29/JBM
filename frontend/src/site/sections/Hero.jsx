import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

const paragraphs = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

export default function Hero({ hero }) {
  if (!hero) return null
  const style = hero.bg_image_url ? { backgroundImage: `url(${hero.bg_image_url})` } : undefined

  return (
    <section id="home" className="hero" style={style}>
      <div className="hero-shade" />
      <div className="container hero-grid">
        <div className="hero-copy">
          {hero.eyebrow && <div className="eyebrow eyebrow-left" data-reveal="up"><span className="line" />{hero.eyebrow}</div>}
          <h1 className="hero-title">
            {hero.headline_1 && <span data-reveal="up" style={{ '--i': 1 }}>{hero.headline_1}</span>}
            {hero.headline_2 && <span className="gold" data-reveal="up" style={{ '--i': 2 }}>{hero.headline_2}</span>}
            {hero.headline_3 && <span data-reveal="up" style={{ '--i': 3 }}>{hero.headline_3}</span>}
          </h1>
          <span className="hero-rule" data-reveal="grow" style={{ '--i': 4 }} />
          {paragraphs(hero.description).map((p, i) => <p key={i} className="hero-text" data-reveal="up" style={{ '--i': 5 + i }}>{p}</p>)}
          <div className="hero-actions" data-reveal="up" style={{ '--i': 7 }}>
            {hero.btn1_label && <SiteLink href={hero.btn1_url} className="btn btn-gold">{hero.btn1_label} <Icon name="arrowUpRight" size={15} /></SiteLink>}
            {hero.btn2_label && <SiteLink href={hero.btn2_url} className="btn btn-outline-light">{hero.btn2_label} <Icon name="arrowUpRight" size={15} /></SiteLink>}
          </div>
        </div>

        {hero.show_card && (
          <aside className="hero-card" data-reveal="right" style={{ '--i': 3 }}>
            <h2>{hero.card_title}</h2>
            <p>{hero.card_text}</p>
            <ul>
              {hero.card_points.map((pt, i) => <li key={i}><Icon name="check" size={18} />{pt}</li>)}
            </ul>
          </aside>
        )}
      </div>

      {hero.show_highlights && hero.highlights.length > 0 && (
        <div className="container highlights-wrap" data-reveal="up" style={{ '--i': 8 }}>
          <div className="highlights">
            {hero.highlights.map((h, i) => (
              <div className="hl-item" key={i}>
                <span className="hl-icon"><Icon name={h.icon} size={20} /></span>
                <span className="hl-text"><small>{h.label}</small><strong>{h.title}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
