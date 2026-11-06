import Icon, { WhatsAppGlyph } from '../icons.jsx'

// WhatsApp + Call buttons that stay on screen while the visitor scrolls.
export default function FloatingIcons({ floating }) {
  if (!floating) return null
  const showWa = floating.show_whatsapp && floating.whatsapp_url
  const showCall = floating.show_call && floating.call_url
  if (!showWa && !showCall) return null

  return (
    <div className={'float-icons ' + (floating.position === 'left' ? 'left' : 'right')}>
      {showCall && (
        <a className="float-btn float-call" href={floating.call_url} aria-label="Call us">
          <Icon name="phone" size={24} />
          <span className="float-tip">Call us</span>
        </a>
      )}
      {showWa && (
        <a className="float-btn float-wa" href={floating.whatsapp_url} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <WhatsAppGlyph size={30} />
          <span className="float-tip">Chat on WhatsApp</span>
        </a>
      )}
    </div>
  )
}
