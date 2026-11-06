import { useEffect, useState } from 'react'

// Number box for ordering: type a position and press Enter (or click away) to move the item there.
export default function OrderInput({ value, max, onCommit }) {
  const [v, setV] = useState(String(value))
  useEffect(() => { setV(String(value)) }, [value])
  const commit = () => {
    const n = parseInt(v, 10)
    if (!n || n < 1) { setV(String(value)); return }
    const pos = Math.min(n, max)
    setV(String(pos))
    if (pos !== value) onCommit(pos)
  }
  return (
    <input className="order-input" type="number" min="1" max={max} value={v} aria-label="Order"
           onChange={(e) => setV(e.target.value)} onBlur={commit}
           onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
  )
}
