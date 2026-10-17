// Header: keeps the studio branding and in-page navigation anchored to the single-page layout.
export default function Header() {
  return (
    <header className="border-b border-[#e4e5df] bg-white/95 px-6 py-5 backdrop-blur-sm sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a href="#top" className="font-[Barlow_Condensed] text-3xl font-extrabold tracking-tight text-[#10110f]">
          NRBFIT<span className="text-[#84ae00]">.</span>
        </a>

        <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#10110f] md:flex" aria-label="Main navigation">
          <a href="#classes" className="transition hover:opacity-70">Classes</a>
          <a href="#coaches" className="transition hover:opacity-70">Coaches</a>
          <a href="#memberships" className="transition hover:opacity-70">Packages</a>
          <a href="#contact" className="transition hover:opacity-70">Contact</a>
        </nav>

        <a
          href="#contact"
          className="inline-flex items-center justify-center bg-[#10110f] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
        >
          Book a visit
        </a>
      </div>
    </header>
  )
}
