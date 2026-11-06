import Icon from '../icons.jsx'

const pad = (n) => String(n).padStart(2, '0')

function Card({ s, n, onOpen }) {
  return (
    <article className={'svc-card' + (s.is_wide ? ' wide' : '')} data-reveal="up" style={{ '--i': s.is_wide ? 0 : (n - 1) % 3 }}>
      <div className="svc-media">
        {s.image_url ? <img src={s.image_url} alt={s.title} loading="lazy" /> : <span className="svc-noimg" />}
      </div>
      <div className="svc-body">
        <div className="svc-kicker"><span className="svc-no">{pad(n)}</span>{s.category && <span>{s.category}</span>}<i /></div>
        <h3>{s.title}</h3>
        {s.description && <p>{s.description}</p>}
        {s.button_label && (
          <button type="button" className="btn btn-terra" onClick={() => onOpen(s)} aria-haspopup="dialog">
            {s.button_label} <Icon name="arrowUpRight" size={14} />
          </button>
        )}
      </div>
    </article>
  )
}

export default function IPServices({ data, onOpen }) {
  if (!data || !data.section || !data.section.show_section) return null
  const { section: s, services } = data
  if (!services.length) return null

  return (
    <section id="ip-services" className="section ip-services">
      <div className="container">
        <header className="sec-head" data-reveal="up">
          {s.eyebrow && <div className="eyebrow eyebrow-center"><span className="line" />{s.eyebrow}<span className="line" /></div>}
          <h2 className="sec-title">{s.heading_plain} {s.heading_gold && <span className="gold-text">{s.heading_gold}</span>}</h2>
          {s.description && <p className="sec-desc">{s.description}</p>}
        </header>

        <div className="svc-grid">
          {services.map((svc, i) => <Card key={svc.id} s={svc} n={i + 1} onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  )
}
