// Footer: closes the page with the studio branding and the final direct enquiry link, matching the original NRBFIT footer design.
export default function Footer() {
  return (
    <footer className="bg-[#10110f] px-6 py-10 text-white sm:px-10 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_1.5fr_1fr] md:items-center">
        <a href="#top" className="font-[Barlow_Condensed] text-3xl font-extrabold tracking-tight text-white">
          NRBFIT<span className="text-[#c8f31d]">.</span>
        </a>

        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2c4bf]">
          Personal training · strength coaching · small-group sessions
        </p>

        <a href="#contact" className="justify-self-end text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Book a visit <span className="ml-2 text-[#c8f31d]">↗</span>
        </a>
      </div>

      <div className="mx-auto mt-6 max-w-7xl border-t border-[#383a36] pt-4 text-[8px] uppercase tracking-[0.14em] text-[#a5a7a1]">
        © 2026 NRBFIT · Nairobi, Kenya
      </div>
    </footer>
  )
}
