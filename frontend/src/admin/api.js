async function call(path, options = {}) {
  const res = await fetch(`/api/admin/${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  })
  let data = {}
  try { data = await res.json() } catch { /* non-JSON response */ }
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    err.errors = data.errors || {}
    throw err
  }
  return data
}

export const adminApi = {
  login: (username, password) => call('login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => call('me.php'),
  users: {
    list: () => call('users.php'),
    create: (d) => call('users.php', { method: 'POST', body: JSON.stringify(d) }),
    update: (d) => call('users.php', { method: 'PUT', body: JSON.stringify(d) }),
    toggle: (id) => call('users.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    remove: (id) => call(`users.php?id=${id}`, { method: 'DELETE' }),
  },
  brand: {
    get: () => call('brand.php'),
    save: (formData) => call('brand.php', { method: 'POST', body: formData }),
  },
  menus: {
    list: () => call('menus.php?all=1'),
    create: (d) => call('menus.php', { method: 'POST', body: JSON.stringify(d) }),
    update: (d) => call('menus.php', { method: 'PUT', body: JSON.stringify(d) }),
    toggle: (id) => call('menus.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('menus.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`menus.php?id=${id}`, { method: 'DELETE' }),
  },
  enquiries: {
    list: () => call('enquiries.php'),
    setRead: (id, is_read) => call('enquiries.php', { method: 'PUT', body: JSON.stringify({ id, is_read }) }),
    remove: (id) => call(`enquiries.php?id=${id}`, { method: 'DELETE' }),
  },
  floating: {
    get: () => call('floating.php'),
    save: (d) => call('floating.php', { method: 'POST', body: JSON.stringify(d) }),
  },
  legal: {
    list: () => call('legal.php?all=1'),
    save: (d) => call('legal.php', { method: 'POST', body: JSON.stringify(d) }),
    toggle: (id) => call('legal.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('legal.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`legal.php?id=${id}`, { method: 'DELETE' }),
  },
  contact: {
    get: () => call('contact.php'),
    save: (fd) => call('contact.php', { method: 'POST', body: fd }),
  },
  footer: {
    get: () => call('footer.php'),
    save: (d) => call('footer.php', { method: 'POST', body: JSON.stringify(d) }),
  },
  faq: {
    list: () => call('faq.php?all=1'),
    saveSection: (fd) => call('faq.php', { method: 'POST', body: fd }),
    saveItem: (d) => call('faq.php', { method: 'POST', body: JSON.stringify({ ...d, action: 'item' }) }),
    toggle: (id) => call('faq.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('faq.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`faq.php?id=${id}`, { method: 'DELETE' }),
  },
  approach: {
    get: () => call('approach.php'),
    save: (fd) => call('approach.php', { method: 'POST', body: fd }),
  },
  cta: {
    get: () => call('cta.php'),
    save: (fd) => call('cta.php', { method: 'POST', body: fd }),
  },
  how: {
    list: () => call('how_it_works.php?all=1'),
    save: (d) => call('how_it_works.php', { method: 'POST', body: JSON.stringify(d) }),
    toggle: (id) => call('how_it_works.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('how_it_works.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`how_it_works.php?id=${id}`, { method: 'DELETE' }),
  },
  growth: {
    list: () => call('growth.php?all=1'),
    saveSection: (fd) => call('growth.php', { method: 'POST', body: fd }),
    saveCard: (fd) => call('growth.php', { method: 'POST', body: fd }),
    toggle: (id) => call('growth.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('growth.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`growth.php?id=${id}`, { method: 'DELETE' }),
  },
  ipServices: {
    list: () => call('ip_services.php?all=1'),
    saveSection: (fd) => call('ip_services.php', { method: 'POST', body: fd }),
    saveService: (fd) => call('ip_services.php', { method: 'POST', body: fd }),
    toggle: (id) => call('ip_services.php', { method: 'PUT', body: JSON.stringify({ id, toggle: true }) }),
    reorder: (id, position) => call('ip_services.php', { method: 'PUT', body: JSON.stringify({ id, position }) }),
    remove: (id) => call(`ip_services.php?id=${id}`, { method: 'DELETE' }),
  },
  hero: {
    get: () => call('hero.php'),
    save: (formData) => call('hero.php', { method: 'POST', body: formData }),
  },
  header: {
    get: () => call('header.php'),
    save: (d) => call('header.php', { method: 'POST', body: JSON.stringify(d) }),
  },
  seo: {
    get: () => call('seo.php'),
    save: (d) => call('seo.php', { method: 'POST', body: JSON.stringify(d) }),
  },
  email: {
    get: () => call('email.php'),
    save: (d) => call('email.php', { method: 'POST', body: JSON.stringify(d) }),
  },
  logout: () => call('logout.php', { method: 'POST' }),
}
