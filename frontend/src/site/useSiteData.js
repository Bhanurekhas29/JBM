import { useEffect, useState } from 'react'

// Every public endpoint the website needs. Each one keeps working on its own if another fails.
const SOURCES = {
  brand: ['brand.php', 'brand'],
  seo: ['seo.php', 'seo'],
  header: ['header.php', 'header'],
  menus: ['menus.php', 'menus'],
  hero: ['hero.php', 'hero'],
  ip: ['ip_services.php', null],      // { section, services }
  growth: ['growth.php', null],       // { section, cards }
  how: ['how_it_works.php', null],    // { section, steps }
  cta: ['cta.php', 'cta'],
  approach: ['approach.php', 'approach'],
  faq: ['faq.php', null],             // { section, items }
  contact: ['contact.php', 'contact'],
  footer: ['footer.php', 'footer'],
  floating: ['floating.php', 'floating'],
  legal: ['legal.php', 'pages'],
}

export default function useSiteData() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all(Object.entries(SOURCES).map(async ([key, [file, field]]) => {
      try {
        const res = await fetch(`/api/admin/${file}`)
        const json = await res.json()
        return [key, field ? json[field] : json]
      } catch {
        return [key, null]
      }
    })).then((pairs) => { if (alive) setData(Object.fromEntries(pairs)) })
    return () => { alive = false }
  }, [])

  return data
}
