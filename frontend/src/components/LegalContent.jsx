// Renders legal page text safely (no raw HTML). Shared by the admin preview and the website popup.
// Format:  "## Heading"  |  "- bullet"  |  blank line = new paragraph  |  **bold**
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)
}

export default function LegalContent({ text }) {
  const blocks = []
  let list = null
  let para = []
  const flushPara = () => { if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = [] } }
  const flushList = () => { if (list) { blocks.push({ type: 'ul', items: list }); list = null } }

  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { flushPara(); flushList(); continue }
    if (line.startsWith('## ')) { flushPara(); flushList(); blocks.push({ type: 'h', text: line.slice(3) }); continue }
    if (/^[-*] /.test(line)) { flushPara(); (list ||= []).push(line.slice(2)); continue }
    flushList(); para.push(line)
  }
  flushPara(); flushList()

  return (
    <div className="legal-text">
      {blocks.map((b, i) =>
        b.type === 'h' ? <h4 key={i}>{b.text}</h4>
        : b.type === 'ul' ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>
        : <p key={i}>{inline(b.text)}</p>)}
    </div>
  )
}
