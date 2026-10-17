import { coachProfiles } from '../data/siteData'

// CoachSection: renders the profile grid from the centralized coach data with local portrait assets.
export default function CoachSection() {
  return (
    <section id="coaches" className="bg-[#f6f7f3] py-16 sm:py-20" aria-labelledby="coaches-title">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
              Your people, in your corner
            </p>
            <h2 id="coaches-title" className="font-[Barlow_Condensed] text-4xl font-bold leading-none tracking-[-0.05em] text-[#10110f] sm:text-5xl lg:text-6xl">
              Meet the coaches<span className="text-[#84ae00]">.</span>
            </h2>
          </div>
          <p className="text-right text-[12px] leading-6 text-[#777a73]">
            Big on good form.<br />
            Bigger on good vibes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {coachProfiles.map((coach, index) => (
            <article key={coach.name} className="overflow-hidden bg-white">
              <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
                <img
                  src={coach.image}
                  alt={`${coach.name}, ${coach.specialty}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-[#c8f31d] px-3 py-2 font-[Barlow_Condensed] text-lg font-bold text-[#10110f]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-[Barlow_Condensed] text-3xl font-semibold leading-none text-[#10110f]">
                      {coach.name}
                    </h3>
                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.14em] text-[#777a73]">
                      {coach.specialty}
                    </p>
                  </div>
                  <span aria-hidden="true" className="text-xl text-[#10110f]">↗</span>
                </div>

                <p className="mt-4 text-[11px] leading-7 text-[#555750]">{coach.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
