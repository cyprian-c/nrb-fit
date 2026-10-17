function App() {
  return (
    <div className="min-h-screen bg-white text-[#10110f] antialiased">
      <header className="border-b border-[#e4e5df] px-6 py-5 sm:px-10 lg:px-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#top" className="font-[Barlow_Condensed] text-3xl font-extrabold tracking-tight text-[#10110f]">
            NRBFIT<span className="text-[#84ae00]">.</span>
          </a>
          <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#10110f] md:flex">
            <a href="#classes">Classes</a>
            <a href="#coaches">Coaches</a>
            <a href="#memberships">Packages</a>
            <a href="#contact">Contact</a>
          </nav>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-none bg-[#10110f] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
          >
            Book a visit
          </a>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-20">
        <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-10 lg:py-14">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c8f31d]" />
              Personal training, Nairobi
            </p>
            <h1 className="font-[Barlow_Condensed] text-[5rem] leading-[0.8] tracking-[-0.06em] text-[#10110f] sm:text-[6rem] lg:text-[8rem]">
              Stronger<br />
              is a <span className="text-[#84ae00]">feeling.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#50524d]">
              A considered approach to strength, conditioning and recovery. Expert coaching, thoughtful programming, and room to train your way.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#classes"
                className="inline-flex items-center justify-center bg-[#10110f] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
              >
                Explore the schedule
              </a>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#777a73]">
                Small-group coaching · Independent gym access
              </p>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-[#e4e5df] pt-5">
              {[
                ['10', 'Daily class slots'],
                ['6', 'Training disciplines'],
                ['1:1', 'Coaching options'],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong className="block font-[Barlow_Condensed] text-3xl font-bold text-[#10110f]">
                    {value}
                  </strong>
                  <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-[#777a73]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[380px] overflow-hidden bg-[#f1f2ed] sm:min-h-[440px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.16),_transparent_60%)]" />
            <div className="absolute right-4 top-5 flex h-24 w-24 flex-col justify-between bg-[#c8f31d] p-3 text-[11px] font-extrabold uppercase leading-[1.05] text-[#10110f]">
              <span>Move<br />your<br />way</span>
              <span className="self-end text-2xl">✳</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#10110f]/80 px-4 py-3 text-[8px] font-bold uppercase tracking-[0.14em] text-white">
              <span>A little space to get a lot stronger.</span>
              <span className="text-[#c8f31d]">01 / 03</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
