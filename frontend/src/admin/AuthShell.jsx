import { ADMIN_LOGO } from './adminAssets.js'

// Shared frame for the sign-in, forgot-password and reset-password screens.
const svg = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
export const MailIcon = () => (
  <svg {...svg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
)
export const LockIcon = () => (
  <svg {...svg}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
)
export const UserIcon = () => (
  <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
)

export default function AuthShell({ title, subtitle, error, shakeKey, children, foot = 'Authorized personnel only' }) {
  return (
    <div className="login-page">
      <div className="login-glow login-glow-a" />
      <div className="login-glow login-glow-b" />
      <div className="login-glow login-glow-c" />
      <span className="login-spark s1" /><span className="login-spark s2" /><span className="login-spark s3" /><span className="login-spark s4" />

      <div className="login-card">
        <div className="login-head">
          <span className="login-logo-wrap">
            <img className="login-logo-img" src={ADMIN_LOGO} alt="JBM" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </span>
          <span className="login-logo">JBM</span>
          <span className="login-rule" />
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {error && <div key={shakeKey} className="login-error" role="alert">{error}</div>}
        {children}
        <p className="login-foot">{foot}</p>
      </div>
    </div>
  )
}
