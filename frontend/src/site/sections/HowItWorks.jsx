import Icon from '../icons.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function HowItWorks({ data }) {
  if (!data || !data.section || !data.section.show_section) return null
  const { section: s, steps } = data
  if (!steps.length) return null

  return (
    <section id="how-it-works" className="section how">
      <span className="how-dots how-dots-a" aria-hidden="true" />
      <span className="how-dots how-dots-b" aria-hidden="true" />
      <div className="container">
        <header className="sec-head" data-reveal="up">
          {s.eyebrow && <div className="eyebrow eyebrow-center"><span className="line" />{s.eyebrow}<span className="line" /></div>}
          <h2 className="sec-title">{s.heading_before} {s.heading_gold && <span className="gold-text">{s.heading_gold}</span>}</h2>
          {s.description && <p className="sec-desc">{s.description}</p>}
        </header>

        <ol className="how-grid" data-reveal="steps">
          {steps.map((st, i) => (
            <li className="how-card" key={st.id} style={{ '--i': i }}>
              <span className="how-no">{pad(i + 1)}</span>
              <span className="how-icon"><Icon name={st.icon} size={38} strokeWidth={1.4} /></span>
              <span className="how-rule" />
              <h3>{st.title}</h3>
              {st.description && <p>{st.description}</p>}
              {i < steps.length - 1 && <span className="how-arrow" aria-hidden="true"><Icon name="arrowRight" size={12} /></span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
