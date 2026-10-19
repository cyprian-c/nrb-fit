// ContactSection: keeps the original enquiry flow, mailto/WhatsApp CTAs, and contact details in the same single-page layout.
export default function ContactSection() {
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
            <a href="mailto:hello@nrbfit.co.ke" className="inline-flex items-center text-sm font-bold text-[#10110f]">
              hello@nrbfit.co.ke <span className="ml-2 text-[#719500]">↗</span>
            </a>
            <p className="mt-3 text-[11px] leading-7 text-[#777a73]">
              Nairobi, Kenya
              <br />
              Visits and training by reservation
            </p>
          </div>
        </div>

        <form className="grid gap-3">
          <label htmlFor="name" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Your name
          </label>
          <input id="name" name="name" autoComplete="name" className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] outline-none focus:ring-2 focus:ring-[#84ae00]" required />

          <label htmlFor="email" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Email address
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] outline-none focus:ring-2 focus:ring-[#84ae00]" required />

          <label htmlFor="interest" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            What can we help with?
          </label>
          <select id="interest" name="interest" defaultValue="" className="min-h-[46px] border border-[#d8dad2] bg-white px-3 text-sm text-[#10110f] outline-none focus:ring-2 focus:ring-[#84ae00]" required>
            <option value="" disabled>Select an enquiry</option>
            <option>Class booking</option>
            <option>Independent gym access</option>
            <option>Membership or class pack</option>
            <option>Personal training</option>
            <option>Other</option>
          </select>

          <label htmlFor="message" className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
            Message
          </label>
          <textarea id="message" name="message" rows="4" className="min-h-[110px] border border-[#d8dad2] bg-white px-3 py-3 text-sm text-[#10110f] outline-none focus:ring-2 focus:ring-[#84ae00]" required />

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="inline-flex min-h-[50px] items-center justify-center bg-[#10110f] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]">
              Send by email
            </button>
            <button type="submit" className="inline-flex min-h-[50px] items-center justify-center border border-[#10110f] bg-white px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#f6f7f3]">
              Continue on WhatsApp
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
