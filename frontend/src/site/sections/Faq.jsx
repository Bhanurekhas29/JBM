import { useState } from 'react'
import Icon from '../icons.jsx'

export default function Faq({ data }) {
  const items = data?.items || []
  const [openId, setOpenId] = useState(items[0]?.id ?? null)   // first question starts open
  if (!data || !data.section || !data.section.show_section || !items.length) return null
  const s = data.section

  return (
    <section id="faqs" className="section faq">
      <div className="container faq-grid">
        <div className="faq-side" data-reveal="left">
          {s.eyebrow && <div className="eyebrow eyebrow-left"><span className="line" />{s.eyebrow}</div>}
          <h2 className="sec-title faq-title">{s.heading_before} {s.heading_gold && <span className="gold-text">{s.heading_gold}</span>}</h2>
          <span className="faq-rule" />
          {s.image_url && <img className="faq-art" src={s.image_url} alt="" loading="lazy" />}
        </div>

        <div className="faq-list">
          {items.map((it, idx) => {
            const open = it.id === openId
            return (
              <div key={it.id} className={'faq-item' + (open ? ' open' : '')} data-reveal="up" style={{ '--i': idx }}>
                <button className="faq-q" aria-expanded={open} aria-controls={`faq-a-${it.id}`} id={`faq-q-${it.id}`}
                        onClick={() => setOpenId(open ? null : it.id)}>
                  <span>{it.question}</span>
                  <i className="faq-toggle" aria-hidden="true"><Icon name={open ? 'close' : 'plus'} size={15} /></i>
                </button>
                <div className="faq-a" id={`faq-a-${it.id}`} role="region" aria-labelledby={`faq-q-${it.id}`}>
                  <div><p>{it.answer}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
