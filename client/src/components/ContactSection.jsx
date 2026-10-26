import { useState, useRef } from 'react'
import { sendEnquiry } from '../api/client.js'
import { ArrowRightIcon } from './icons.jsx'

// ContactSection: handles direct database enquiry submission with fallback to mailto and WhatsApp.
export default function ContactSection() {
  const formRef = useRef(null)
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitApi = async (e) => {
    e.preventDefault()
    if (!formRef.current || !formRef.current.reportValidity()) return

    const formData = new FormData(formRef.current)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const interest = String(formData.get('interest') || '').trim()
    const message = String(formData.get('message') || '').trim()

    setIsSubmitting(true)
    setStatus('')

    try {
      await sendEnquiry({ name, email, interest, message })
      setStatus('Enquiry received! Studio team will contact you shortly.')
      formRef.current.reset()
    } catch {
      // If server or network fails, offer instant mailto fallback
      setStatus('Saved draft! Opening your default email client...')
      const subject = `NRBFIT Enquiry: ${interest} - ${name}`
      const body = `Hi NRBFIT team,\n\nName: ${name}\nEmail: ${email}\nEnquiry Topic: ${interest}\n\nMessage:\n${message}\n`
      window.location.href = `mailto:hello@nrbfit.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setStatus(''), 7000)
    }
  }

  const handleAction = (channel) => {
    if (!formRef.current || !formRef.current.reportValidity()) return

    const formData = new FormData(formRef.current)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const interest = String(formData.get('interest') || '').trim()
    const message = String(formData.get('message') || '').trim()

    if (channel === 'email') {
      const subject = `NRBFIT Enquiry: ${interest} - ${name}`
      const body = `Hi NRBFIT team,\n\nName: ${name}\nEmail: ${email}\nEnquiry Topic: ${interest}\n\nMessage:\n${message}\n`
      setStatus('Opening your email client...')
      window.location.href = `mailto:hello@nrbfit.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else if (channel === 'whatsapp') {
      const text = `Hi NRBFIT! My name is ${name} (${email}). I'm reaching out about ${interest}.\n\n${message}`
      setStatus('Opening WhatsApp...')
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    }

    setTimeout(() => setStatus(''), 4000)
  }

  return (
    <section id="contact" className="bg-[#f6f7f3] py-16 sm:py-20" aria-labelledby="contact-title">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-20">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
            Let’s get you moving
          </p>
          <h2 id="contact-title" className="font-[Barlow_Condensed] text-5xl font-extrabold leading-[0.84] tracking-[-0.06em] text-[#10110f] sm:text-6xl lg:text-7xl">
            Talk to<br />
            the studio<span className="text-[#84ae00]">.</span>
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#555750]">
            Ask about a class, independent gym access, personal training or the right package for you. We’ll get back to you with availability and next steps.
          </p>

          <div className="mt-8 border-t border-[#dfe1d9] pt-5">
            <a href="mailto:hello@nrbfit.co.ke" className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#10110f] transition hover:text-[#84ae00]">
              <span>hello@nrbfit.co.ke</span>
              <ArrowRightIcon className="h-3.5 w-3.5 text-[#719500] transition group-hover:translate-x-0.5" />
            </a>
            <p className="mt-3 text-[11px] leading-7 text-[#777a73]">
              Nairobi, Kenya
              <br />
              Visits and training by reservation
            </p>
          </div>
        </div>

        {/* Rounded Card Enclosure for Form */}
        <div className="rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs sm:p-8">
          <form ref={formRef} onSubmit={handleSubmitApi} className="grid gap-3.5">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
                Your name
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="e.g. Amani Odhiambo"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="e.g. amani@example.com"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
                required
              />
            </div>

            <div>
              <label htmlFor="interest" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
                What can we help with?
              </label>
              <select
                id="interest"
                name="interest"
                defaultValue=""
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
                required
              >
                <option value="" disabled>Select an enquiry</option>
                <option value="Class booking">Class booking</option>
                <option value="Independent gym access">Independent gym access</option>
                <option value="Membership or class pack">Membership or class pack</option>
                <option value="Personal training">Personal training</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="Tell us about your training goals or preferred time slots..."
                className="mt-1.5 min-h-[100px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] p-3.5 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
                required
              />
            </div>

            {/* Sleek Buttons */}
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Send Enquiry'}
              </button>
              <button
                type="button"
                onClick={() => handleAction('whatsapp')}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#10110f] shadow-xs transition-all duration-200 hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
              >
                Continue on WhatsApp
              </button>
            </div>

            {status && (
              <p className="mt-2 text-xs font-semibold text-[#719500]" role="status">
                {status}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
