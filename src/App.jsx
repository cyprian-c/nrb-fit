import Header from './components/Header'
import Hero from './components/Hero'
import ClassScheduleSection from './components/ClassScheduleSection'
import CoachSection from './components/CoachSection'
import MembershipSection from './components/MembershipSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10110f] antialiased">
      <Header />

      <main id="top">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-20">
          <Hero />
          <ClassScheduleSection />
          <CoachSection />
          <MembershipSection />
        </div>
        <ContactSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
