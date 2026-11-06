// One icon set for the whole website. Admin dropdown names map to these keys.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const paths = {
  shield: <><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  document: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  review: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M14 3l5 5v3" /><path d="M14 3v5h5" /><circle cx="16.5" cy="16.5" r="3" /><path d="M21 21l-2-2" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.3c2.2.7 3.5 2.6 3.5 5.7" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  handshake: <><path d="M3 12l4-4 4 1 3-2 7 6" /><path d="M5 14l4 4a2 2 0 0 0 3 0l1-1 2 2a2 2 0 0 0 3-3l-6-6" /><path d="M3 12v4M21 13v3" /></>,
  pointer: <><path d="M9 11V5a1.5 1.5 0 0 1 3 0v5l5 1.5a2 2 0 0 1 1.5 2.3L17.5 19a2 2 0 0 1-2 1.5H11a2 2 0 0 1-1.6-.8L5.5 14a1.5 1.5 0 0 1 2.2-2L9 13" /><path d="M6 4a4 4 0 0 1 7-1.5M15 3.5" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />,
  tick: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  building: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  message: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  mapPin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v6M8 7.5v.01M12 17v-6M12 13c0-1.7 1-2 2-2s2 .7 2 2.5V17" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.01" /></>,
  x: <path d="M5 4l14 16M19 4L5 20" />,
}

export default function Icon({ name, size = 20, className = '', ...rest }) {
  return (
    <svg {...base} width={size} height={size} className={className} {...rest}>
      {paths[name] || paths.check}
    </svg>
  )
}

export function WhatsAppGlyph({ size = 26 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.1.55 4.15 1.6 5.96L4 28l7.2-1.55a12 12 0 0 0 4.84 1.03C22.67 27.48 28 22.1 28 15.5 28 8.65 22.67 3 16.04 3zm0 22.2c-1.5 0-2.98-.4-4.27-1.16l-.3-.18-4.27.92.95-4.16-.2-.32A9.9 9.9 0 0 1 6 15.03C6 9.5 10.5 5 16.04 5 21.6 5 26 9.7 26 15.5c0 5.4-4.44 9.7-9.96 9.7zm5.5-7.3c-.3-.15-1.8-.9-2.08-1-.28-.1-.48-.15-.68.15-.2.3-.78 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.52-.08-.15-.68-1.65-.93-2.25-.25-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.38-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.5.7.3 1.27.5 1.7.62.72.23 1.37.2 1.88.12.58-.08 1.8-.74 2.05-1.45.25-.7.25-1.32.18-1.45-.08-.12-.28-.2-.58-.35z" />
    </svg>
  )
}
