import { useEffect } from 'react'

// Reveals every [data-reveal] element as it scrolls into view.
// - Uses IntersectionObserver, plus a scroll/resize position check as a safety net.
// - Visitors who prefer reduced motion get everything shown immediately.
// - Without JavaScript nothing is hidden: the "reveal-ready" class that hides elements is only added here.
export default function useScrollReveal(ready) {
  useEffect(() => {
    if (!ready) return
    const root = document.querySelector('.site')
    if (!root) return
    const els = [...root.querySelectorAll('[data-reveal]')]
    const show = (el) => el.classList.add('is-visible')

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(show); return }

    root.classList.add('reveal-ready')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    els.forEach((el) => io.observe(el))

    const check = () => {
      els.forEach((el) => {
        if (el.classList.contains('is-visible')) return
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) show(el)
      })
    }
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    const t = setTimeout(check, 400)
    return () => { io.disconnect(); window.removeEventListener('scroll', check); window.removeEventListener('resize', check); clearTimeout(t); root.classList.remove('reveal-ready') }
  }, [ready])
}
