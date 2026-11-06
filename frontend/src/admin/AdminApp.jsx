import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './Toast.jsx'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Brand from './pages/Brand.jsx'
import Enquiries from './pages/Enquiries.jsx'
import Contact from './pages/Contact.jsx'
import FloatingIcons from './pages/FloatingIcons.jsx'
import LegalPages from './pages/LegalPages.jsx'
import Footer from './pages/Footer.jsx'
import Faqs from './pages/Faqs.jsx'
import Approach from './pages/Approach.jsx'
import CtaBanner from './pages/CtaBanner.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Growth from './pages/Growth.jsx'
import IPServices from './pages/IPServices.jsx'
import Hero from './pages/Hero.jsx'
import Header from './pages/Header.jsx'
import SEO from './pages/SEO.jsx'
import EmailSettings from './pages/EmailSettings.jsx'
import AdminLayout from './AdminLayout.jsx'
import { ADMIN_LOGO, ADMIN_TITLE } from './adminAssets.js'
import './admin.css'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="adm-loading">Loading...</div>
  return user ? children : <Navigate to="/admin/login" replace />
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="adm-loading">Loading...</div>
  return user ? <Navigate to="/admin" replace /> : children
}

export default function AdminApp() {
  // Tab title + icon for every admin screen
  useEffect(() => {
    const prevTitle = document.title
    const link = document.querySelector("link[rel~='icon']")
    const prevHref = link?.href
    document.title = ADMIN_TITLE
    const img = new Image()
    img.onload = () => {
      let l = document.querySelector("link[rel~='icon']")
      if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l) }
      l.href = ADMIN_LOGO
    }
    img.src = ADMIN_LOGO
    return () => {
      document.title = prevTitle
      const l = document.querySelector("link[rel~='icon']")
      if (l && prevHref) l.href = prevHref
    }
  }, [])

  return (
    <ToastProvider>
    <AuthProvider>
      <Routes>
        <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route element={<Protected><AdminLayout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="brand" element={<Brand />} />
          <Route path="seo" element={<SEO />} />
          <Route path="header" element={<Header />} />
          <Route path="hero" element={<Hero />} />
          <Route path="ip-services" element={<IPServices />} />
          <Route path="our-services" element={<Growth />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="talk-to-our-team" element={<CtaBanner />} />
          <Route path="our-approach" element={<Approach />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="footer" element={<Footer />} />
          <Route path="legal-pages" element={<LegalPages />} />
          <Route path="floating-icons" element={<FloatingIcons />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="email-settings" element={<EmailSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
    </ToastProvider>
  )
}
