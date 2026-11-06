import { useCallback, useMemo, useState } from 'react'
import './site.css'
import useSiteData from './useSiteData.js'
import useScrollReveal from './useScrollReveal.js'
import { LegalContext, scrollToId } from './SiteLink.jsx'
import ServicePopup from './ServicePopup.jsx'
import LegalModal from './LegalModal.jsx'
import Header from './sections/Header.jsx'
import Hero from './sections/Hero.jsx'
import IPServices from './sections/IPServices.jsx'
import OurServices from './sections/OurServices.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import CtaBanner from './sections/CtaBanner.jsx'
import Approach from './sections/Approach.jsx'
import Faq from './sections/Faq.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './sections/Footer.jsx'
import FloatingIcons from './sections/FloatingIcons.jsx'

// Sections are added one at a time, in page order.
export default function Landing() {
  const data = useSiteData()
  useScrollReveal(!!data)
  const [legalSlug, setLegalSlug] = useState(null)
  const closeLegal = useCallback(() => setLegalSlug(null), [])
  const legal = useMemo(() => ({ open: setLegalSlug }), [])

  // Service pop-up (opened from the IP Services cards) and the pre-fill handed to the contact form
  const [service, setService] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const closeService = useCallback(() => setService(null), [])
  const enquire = useCallback((svc) => {
    setService(null)
    setPrefill({ title: svc.title, nonce: Date.now() })
    const url = svc.button_url || '#contact'
    setTimeout(() => {
      if (url.startsWith('#') && url.length > 1) scrollToId(url.slice(1))
      else window.open(url, /^https?:\/\//i.test(url) ? '_blank' : '_self')
    }, 60)
  }, [])

  if (!data) return <div className="site site-loading" aria-busy="true" />

  return (
    <LegalContext.Provider value={legal}>
      <div className="site">
        <Header brand={data.brand} header={data.header} menus={data.menus} />
        <main>
          <Hero hero={data.hero} />
          <IPServices data={data.ip} onOpen={setService} />
          <OurServices data={data.growth} />
          <HowItWorks data={data.how} />
          <CtaBanner cta={data.cta} />
          <Approach approach={data.approach} />
          <Faq data={data.faq} />
          <Contact contact={data.contact} prefill={prefill} />
        </main>
        <Footer brand={data.brand} footer={data.footer} />
        <FloatingIcons floating={data.floating} />
        <ServicePopup service={service} section={data.ip?.section || {}} onClose={closeService} onEnquire={enquire} />
        <LegalModal slug={legalSlug} pages={data.legal} onClose={closeLegal} />
      </div>
    </LegalContext.Provider>
  )
}
