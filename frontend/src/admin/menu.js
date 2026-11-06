// Single source of truth for the sidebar.
// A group: { header?: 'LABEL', items: [...] }
// An item: { label, icon, to, end?, external? }
export const menu = [
  {
    items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin', end: true },
      { label: 'View Website', icon: 'globe', to: '/', external: true },
      { label: 'Enquiries', icon: 'inbox', to: '/admin/enquiries' },
    ],
  },
  {
    header: 'Authentication',
    items: [
      { label: 'Users', icon: 'users', to: '/admin/users' },
      { label: 'Brand', icon: 'image', to: '/admin/brand' },
      { label: 'SEO', icon: 'search', to: '/admin/seo' },
      { label: 'Email Settings', icon: 'mail', to: '/admin/email-settings' },
    ],
  },
  {
    header: 'Website',
    items: [
      { label: 'Header', icon: 'menu', to: '/admin/header' },
      { label: 'Hero Section', icon: 'layers', to: '/admin/hero' },
      { label: 'IP Services', icon: 'briefcase', to: '/admin/ip-services' },
      { label: 'Our Services', icon: 'trend', to: '/admin/our-services' },
      { label: 'How It Works', icon: 'steps', to: '/admin/how-it-works' },
      { label: 'Talk to Our Team', icon: 'flag', to: '/admin/talk-to-our-team' },
      { label: 'Our Approach', icon: 'target', to: '/admin/our-approach' },
      { label: 'FAQs', icon: 'help', to: '/admin/faqs' },
      { label: 'Contact', icon: 'phone', to: '/admin/contact' },
      { label: 'Footer', icon: 'footer', to: '/admin/footer' },
      { label: 'Legal Pages', icon: 'file', to: '/admin/legal-pages' },
      { label: 'Floating Icons', icon: 'chat', to: '/admin/floating-icons' },
    ],
  },
]
