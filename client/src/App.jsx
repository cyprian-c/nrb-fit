import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import { useAuth } from './context/AuthContext'

const ProgramsTeaserSection = lazy(() => import('./components/ProgramsTeaserSection'))
const ClassScheduleSection = lazy(() => import('./components/ClassScheduleSection'))
const CoachSection = lazy(() => import('./components/CoachSection'))
const MembershipSection = lazy(() => import('./components/MembershipSection'))
const ContactSection = lazy(() => import('./components/ContactSection'))
const MemberPortal = lazy(() => import('./components/portal/MemberPortal'))
const AuthModal = lazy(() => import('./components/AuthModal'))
const Success = lazy(() => import('./pages/Success'))

function SectionLoadingFallback() {
  return (
    <div className="flex min-h-[160px] w-full items-center justify-center py-12">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 animate-ping rounded-full bg-[#c8f31d]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
          Loading NRBFIT...
        </span>
      </div>
    </div>
  )
}

function App() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/success') || window.location.search.includes('session_id')) {
        return 'success'
      }
      return window.location.hash === '#portal' ? 'portal' : 'studio'
    }
    return 'studio'
  })

  // Handle hash and popstate changes for seamless navigation
  useEffect(() => {
    function handleLocationChange() {
      if (window.location.pathname.startsWith('/success') || window.location.search.includes('session_id')) {
        setCurrentView('success')
      } else if (window.location.hash === '#portal') {
        setCurrentView('portal')
      } else if (window.location.hash === '#studio' || !window.location.hash) {
        setCurrentView('studio')
      }
    }

    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  function handleSelectView(view) {
    if (view === 'portal' && !user) {
      setAuthModalOpen(true)
      return
    }
    setCurrentView(view)
    if (typeof window !== 'undefined') {
      if (view === 'studio') {
        window.history.pushState({}, '', '/')
      } else {
        window.location.hash = view === 'portal' ? 'portal' : 'top'
      }
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
        <Suspense fallback={<SectionLoadingFallback />}>
          {currentView === 'success' ? (
            <Success
              onGoToPortal={() => handleSelectView('portal')}
              onBackToHome={() => handleSelectView('studio')}
            />
          ) : currentView === 'portal' && user ? (
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
                <MembershipSection onOpenAuth={() => setAuthModalOpen(true)} />
              </div>
              <ContactSection />
            </>
          )}
        </Suspense>
      </main>

      <Footer />

      <Suspense fallback={null}>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  )
}

export default App
