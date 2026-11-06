import { useEffect, useState } from 'react'
import Icon from '../icons.jsx'
import SiteLink from '../SiteLink.jsx'

const PHONE_RE = /^\+?\d{8,15}$/   // digits only (optional leading + for the country code)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Keeps only digits (and one leading +) - letters and symbols are dropped as the visitor types or pastes.
const cleanPhone = (v) => {
  let s = v.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return s.slice(0, s.startsWith('+') ? 16 : 15)
}
// Turns the words "Privacy Policy" in the consent text into a link that opens the policy popup.
function consentWithLink(text) {
  const parts = text.split(/(Privacy Policy)/)
  return parts.map((part, i) => part === 'Privacy Policy'
    ? <SiteLink key={i} href="#legal:privacy-policy" className="cf-link" onClick={(e) => e.stopPropagation()}>{part}</SiteLink>
    : part)
}
const blank = { name: '', email: '', phone: '', organization: '', service: '', message: '', consent: false, company_site: '' }

function validate(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Please enter your name.'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.'
  if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Please enter a valid mobile number (numbers only).'
  if (!f.message.trim()) e.message = 'Please enter your message.'
  if (!f.consent) e.consent = 'Please tick the box to continue.'
  return e
}

export default function Contact({ contact, prefill }) {
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')      // idle | sending | done | failed
  const [notice, setNotice] = useState('')
  // "Enquire about this service" in the popup: pick the service and start the message
  useEffect(() => {
    if (!prefill) return
    const options = contact?.service_options || []
    setF((s) => ({
      ...s,
      service: options.includes(prefill.title) ? prefill.title : s.service,
      message: s.message.trim() ? s.message : `I would like to enquire about ${prefill.title}.`,
    }))
    setErrors((e) => ({ ...e, service: undefined, message: undefined }))
    setStatus((st) => (st === 'done' ? 'idle' : st))
  }, [prefill?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!contact || !contact.show_section) return null
  const c = contact

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setF((s) => ({ ...s, [k]: value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    const v = validate(f)
    setErrors(v)
    if (Object.keys(v).length) return
    setStatus('sending'); setNotice('')
    try {
      const res = await fetch('/api/enquiry.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), message: f.message.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) { setStatus('done'); setNotice(data.message || c.success_message); setF(blank); return }
      setErrors(data.errors || {})
      setNotice(data.message || 'Something went wrong. Please try again.')
      setStatus('failed')
    } catch {
      setNotice('Could not reach the server. Please check your connection and try again.')
      setStatus('failed')
    }
  }

  const field = (key, icon, placeholder, extra = {}) => (
    <div className={'cf-field' + (errors[key] ? ' bad' : '')}>
      <span className="cf-icon"><Icon name={icon} size={17} /></span>
      <input name={key} value={f[key]} onChange={extra.onChange || set(key)} placeholder={placeholder} aria-label={placeholder}
             aria-invalid={!!errors[key]} {...extra} onChange={extra.onChange || set(key)} />
      {errors[key] && <small className="cf-err">{errors[key]}</small>}
    </div>
  )

  return (
    <section id="contact" className="contact">
      <div className="contact-bg" style={c.image_url ? { backgroundImage: `url(${c.image_url})` } : undefined} aria-hidden="true" />
      <div className="container contact-grid">
        <div className="contact-spacer" aria-hidden="true" />

        <div className="contact-copy" data-reveal="left">
          {c.eyebrow && <div className="eyebrow eyebrow-left"><span className="line" />{c.eyebrow}</div>}
          <h2>{c.heading_before} {c.heading_gold && <span className="gold-text">{c.heading_gold}</span>}</h2>
          {c.description && <p className="contact-desc">{c.description}</p>}
          <ul className="contact-points">
            {c.points.map((p, i) => (
              <li key={i}>
                <span className="cp-icon"><Icon name={p.icon} size={15} /></span>
                <span><strong>{p.title}</strong>{p.text && <small>{p.text}</small>}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="contact-card" data-reveal="right" style={{ '--i': 1 }}>
          {status === 'done' ? (
            <div className="cf-success" role="status">
              <span className="cf-success-icon"><Icon name="check" size={34} /></span>
              <h3>Enquiry sent</h3>
              <p>{notice}</p>
              <button type="button" className="btn btn-navy" onClick={() => { setStatus('idle'); setNotice('') }}>Send another enquiry</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {c.form_title && <h3 className="cf-title">{c.form_title}</h3>}
              {c.form_subtitle && <p className="cf-sub">{c.form_subtitle}</p>}

              <div className="cf-row">
                {field('name', 'user', 'Your Name *', { autoComplete: 'name' })}
                {field('email', 'mail', 'Your Email *', { type: 'email', autoComplete: 'email' })}
              </div>
              <div className="cf-row">
                {field('phone', 'phone', 'Phone Number *', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', maxLength: 16,
                  onChange: (e) => { const v = cleanPhone(e.target.value); setF((s) => ({ ...s, phone: v })); if (errors.phone) setErrors((x) => ({ ...x, phone: undefined })) } })}
                {field('organization', 'building', 'Business / Organization', { autoComplete: 'organization' })}
              </div>

              {c.service_options.length > 0 && (
                <div className={'cf-field cf-select' + (errors.service ? ' bad' : '')}>
                  <span className="cf-icon"><Icon name="grid" size={17} /></span>
                  <select name="service" value={f.service} onChange={set('service')} aria-label="Select Service" className={f.service ? '' : 'placeholder'}>
                    <option value="">Select Service</option>
                    {c.service_options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <Icon name="chevronDown" size={17} className="cf-chevron" />
                  {errors.service && <small className="cf-err">{errors.service}</small>}
                </div>
              )}

              <div className={'cf-field cf-area' + (errors.message ? ' bad' : '')}>
                <span className="cf-icon"><Icon name="message" size={17} /></span>
                <textarea name="message" rows="3" value={f.message} onChange={set('message')} placeholder="Your Message *" aria-label="Your Message"
                          aria-invalid={!!errors.message} />
                {errors.message && <small className="cf-err">{errors.message}</small>}
              </div>

              {/* honeypot: hidden from people, bots fill it in */}
              <input className="cf-hp" name="company_site" tabIndex={-1} autoComplete="off" value={f.company_site} onChange={set('company_site')} aria-hidden="true" />

              {c.consent_text && (
                <label className={'cf-consent' + (errors.consent ? ' bad' : '')}>
                  <input type="checkbox" checked={f.consent} onChange={set('consent')} />
                  <span>{consentWithLink(c.consent_text)}</span>
                </label>
              )}
              {errors.consent && <small className="cf-err cf-err-block">{errors.consent}</small>}

              {status === 'failed' && notice && <div className="cf-alert" role="alert">{notice}</div>}

              <button type="submit" className="btn btn-gold cf-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'SENDING...' : (c.button_label || 'Send Enquiry').toUpperCase()} <Icon name="arrowRight" size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
