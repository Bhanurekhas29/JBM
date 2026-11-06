import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

export default function CtaBanner({ cta }) {
  if (!cta || !cta.show_section) return null
  const style = cta.bg_image_url ? { backgroundImage: `url(${cta.bg_image_url})` } : undefined

  return (
    <section id="talk-to-our-team" className="section cta-section">
      <div className="container">
        <div className="cta-banner" style={style} data-reveal="zoom">
          <div className="cta-shade" />
          <div className="cta-copy">
            {cta.tagline && <div className="cta-tag"><span>{cta.tagline}</span><i /></div>}
            <h2>
              {cta.heading_before} {cta.heading_gold && <span className="gold-text">{cta.heading_gold}</span>}
              {cta.heading_after && <><br />{cta.heading_after}</>}
            </h2>
            {cta.description && <p>{cta.description}</p>}
          </div>
          {cta.button_label && (
            <div className="cta-action">
              <SiteLink href={cta.button_url} newTab={cta.button_new_tab} className="btn btn-gold">
                {cta.button_label} <Icon name="arrowRight" size={15} />
              </SiteLink>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
