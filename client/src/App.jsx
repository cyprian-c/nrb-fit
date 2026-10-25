import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ClassScheduleSection from './components/ClassScheduleSection'
import CoachSection from './components/CoachSection'
import MembershipSection from './components/MembershipSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10110f] antialiased">
      <Header onOpenAuth={() => setAuthModalOpen(true)} />

      <main id="top">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-20">
          <Hero />
          <ClassScheduleSection onOpenAuth={() => setAuthModalOpen(true)} />
          <CoachSection />
          <MembershipSection />
        </div>
        <ContactSection />
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
