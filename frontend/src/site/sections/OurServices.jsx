import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

export default function OurServices({ data }) {
  if (!data || !data.section || !data.section.show_section) return null
  const { section: s, cards } = data
  if (!cards.length) return null

  return (
    <section id="our-services" className="section our-services">
      {/* the menu's "Business Growth" link (#business-growth) lands here too */}
      <span id="business-growth" className="anchor-alias" aria-hidden="true" />
      <div className="container">
        <header className="sec-head sec-head-dark" data-reveal="up">
          {s.eyebrow && <div className="eyebrow eyebrow-center"><span className="line" />{s.eyebrow}<span className="line" /></div>}
          <h2 className="sec-title">
            {s.heading_before} {s.heading_gold && <span className="gold-text">{s.heading_gold}</span>} {s.heading_after}
          </h2>
          {s.description && <p className="sec-desc">{s.description}</p>}
        </header>

        <div className="os-grid">
          {cards.map((c, i) => (
            <article className="os-card" key={c.id} data-reveal={i % 2 === 0 ? 'left' : 'right'}>
              <div className="os-media">
                {c.image_url ? <img src={c.image_url} alt={c.title} loading="lazy" /> : <span className="svc-noimg" />}
              </div>
              <div className="os-body">
                {c.category && <div className="os-kicker">{c.category}<i /></div>}
                <h3>{c.title}</h3>
                {c.description && <p className="os-desc">{c.description}</p>}
                {c.items.length > 0 && (
                  <>
                    {c.list_title && <div className="os-list-title">{c.list_title}</div>}
                    <ul className="os-list">
                      {c.items.map((it, i) => <li key={i}><Icon name="check" size={17} />{it}</li>)}
                    </ul>
                  </>
                )}
                {c.button_label && (
                  <SiteLink href={c.button_url} className="link-circle">
                    {c.button_label}<span><Icon name="arrowRight" size={13} /></span>
                  </SiteLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
