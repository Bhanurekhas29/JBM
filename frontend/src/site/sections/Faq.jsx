import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../icons.jsx'

// One answer. Height is measured so it slides open/closed smoothly in every browser,
// while the text itself fades and rises a little (see .faq-a in site.css).
function Answer({ id, labelledBy, open, children }) {
  const inner = useRef(null)
  const [h, setH] = useState(0)
  useLayoutEffect(() => { if (inner.current) setH(inner.current.scrollHeight) }, [children])
  useEffect(() => {
    const onResize = () => inner.current && setH(inner.current.scrollHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return (
    <div className="faq-a" id={id} role="region" aria-labelledby={labelledBy} aria-hidden={!open}
         style={{ height: open ? h : 0 }}>
      <div ref={inner}>{children}</div>
    </div>
  )
}

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
              <div key={it.id} className="faq-slot" data-reveal="up" style={{ '--i': idx }}>
              {/* the reveal script owns the slot's class; React only changes the inner item, so "open" never wipes it */}
              <div className={'faq-item' + (open ? ' open' : '')}>
                <button className="faq-q" aria-expanded={open} aria-controls={`faq-a-${it.id}`} id={`faq-q-${it.id}`}
                        onClick={() => setOpenId(open ? null : it.id)}>
                  <span>{it.question}</span>
                  <i className="faq-toggle" aria-hidden="true"><Icon name={open ? 'close' : 'plus'} size={15} /></i>
                </button>
                <Answer id={`faq-a-${it.id}`} labelledBy={`faq-q-${it.id}`} open={open}>
                  <p>{it.answer}</p>
                </Answer>
              </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
