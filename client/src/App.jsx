import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ClassScheduleSection from './components/ClassScheduleSection'
import CoachSection from './components/CoachSection'
import MembershipSection from './components/MembershipSection'
import ContactSection from './components/ContactSection'
import ProgramsTeaserSection from './components/ProgramsTeaserSection'
import MemberPortal from './components/portal/MemberPortal'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import { useAuth } from './context/AuthContext'

function App() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash === '#portal'
      ? 'portal'
      : 'studio'
  })

  // Handle hash changes for seamless back/forward navigation
  useEffect(() => {
    function handleHashChange() {
      if (window.location.hash === '#portal') {
        setCurrentView('portal')
      } else if (window.location.hash === '#studio' || !window.location.hash) {
        setCurrentView('studio')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleSelectView(view) {
    if (view === 'portal' && !user) {
      setAuthModalOpen(true)
      return
    }
    setCurrentView(view)
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'portal' ? 'portal' : 'top'
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10110f] antialiased">
      <Header
        onOpenAuth={() => setAuthModalOpen(true)}
        currentView={currentView}
        onSelectView={handleSelectView}
      />

      <main id="top">
        {currentView === 'portal' && user ? (
          <MemberPortal onBackToStudio={() => handleSelectView('studio')} />
        ) : (
          <>
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-20">
              <Hero />
              <ProgramsTeaserSection
                onOpenPortal={() => handleSelectView('portal')}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
              <ClassScheduleSection onOpenAuth={() => setAuthModalOpen(true)} />
              <CoachSection />
              <MembershipSection />
            </div>
            <ContactSection />
          </>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  )
}

export default App
