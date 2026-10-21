import { useState, useRef } from 'react'

// ContactSection: handles enquiry workflows via direct mailto or WhatsApp deep link with client-side validation.
export default function ContactSection() {
  const formRef = useRef(null)
  const [status, setStatus] = useState('')

  const handleAction = (channel) => {
    if (!formRef.current) return

    if (!formRef.current.reportValidity()) {
      return
    }

    const formData = new FormData(formRef.current)
    const name = formData.get('name') || ''
    const email = formData.get('email') || ''
    const interest = formData.get('interest') || ''
    const message = formData.get('message') || ''

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
            <a href="mailto:hello@nrbfit.co.ke" className="inline-flex items-center text-sm font-bold text-[#10110f] transition hover:text-[#84ae00]">
              hello@nrbfit.co.ke <span className="ml-2 text-[#719500]">↗</span>
            </a>
            <p className="mt-3 text-[11px] leading-7 text-[#777a73]">
              Nairobi, Kenya
              <br />
              Visits and training by reservation
            </p>
          </div>
        </div>

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <label htmlFor="name" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Your name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="e.g. Amani Odhiambo"
            className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none focus:ring-2 focus:ring-[#84ae00]"
            required
          />

          <label htmlFor="email" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. amani@example.com"
            className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none focus:ring-2 focus:ring-[#84ae00]"
            required
          />

          <label htmlFor="interest" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            What can we help with?
          </label>
          <select
            id="interest"
            name="interest"
            defaultValue=""
            className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] outline-none focus:ring-2 focus:ring-[#84ae00]"
            required
          >
            <option value="" disabled>Select an enquiry</option>
            <option value="Class booking">Class booking</option>
            <option value="Independent gym access">Independent gym access</option>
            <option value="Membership or class pack">Membership or class pack</option>
            <option value="Personal training">Personal training</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="message" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            placeholder="Tell us about your training goals or preferred time slots..."
            className="min-h-[110px] border border-[#d8dad2] bg-white px-3 py-3 text-sm text-[#10110f] placeholder:text-[#a5a7a1] outline-none focus:ring-2 focus:ring-[#84ae00]"
            required
          />

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAction('email')}
              className="inline-flex min-h-[50px] cursor-pointer items-center justify-center bg-[#10110f] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
            >
              Send by email
            </button>
            <button
              type="button"
              onClick={() => handleAction('whatsapp')}
              className="inline-flex min-h-[50px] cursor-pointer items-center justify-center border border-[#10110f] bg-white px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#f6f7f3]"
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
    </section>
  )
}
