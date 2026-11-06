import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AdminApp from './admin/AdminApp.jsx'
import Landing from './site/Landing.jsx'

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  // Apply brand favicon and website name to the browser tab
  useEffect(() => {
    if (isAdmin) return
    fetch('/api/admin/brand.php').then((r) => r.json()).then(({ brand }) => {
      if (!brand) return
      if (brand.website_name) document.title = brand.website_name
      if (brand.favicon_url) {
        let l = document.querySelector("link[rel~='icon']")
        if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l) }
        l.href = brand.favicon_url
      }
    }).catch(() => {})
  }, [isAdmin])

  // Apply SEO meta (title wins over the brand name) to the website <head>
  useEffect(() => {
    if (isAdmin) return
    const meta = (name, content) => {
      if (!content) return
      let m = document.querySelector(`meta[name="${name}"]`)
      if (!m) { m = document.createElement('meta'); m.name = name; document.head.appendChild(m) }
      m.content = content
    }
    fetch('/api/admin/seo.php').then((r) => r.json()).then(({ seo }) => {
      if (!seo) return
      if (seo.meta_title) document.title = seo.meta_title
      meta('description', seo.meta_description)
      meta('keywords', [seo.primary_keywords, seo.secondary_keywords].filter(Boolean).join(', '))
    }).catch(() => {})
  }, [isAdmin])

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/" element={<Landing />} />
    </Routes>
  )
}
