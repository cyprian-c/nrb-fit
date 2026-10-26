import { useEffect, useState } from 'react'
import { fetchCoaches } from '../api/client.js'
import { coachProfiles as fallbackCoaches } from '../data/siteData'
import { ArrowRightIcon } from './icons.jsx'

// CoachSection: shows coaching team with bio details, imagery, and live database sync.
export default function CoachSection() {
  const [coaches, setCoaches] = useState(fallbackCoaches)

  useEffect(() => {
    let isMounted = true

    fetchCoaches()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Merge API data with bundled portrait images
          const merged = data.map((remote) => {
            const fallback = fallbackCoaches.find((f) => f.name.toLowerCase() === remote.name.toLowerCase())
            return {
              ...remote,
              image: fallback ? fallback.image : fallbackCoaches[0].image,
            }
          })
          setCoaches(merged)
        }
      })
      .catch(() => {
        // Fall back gracefully to bundled coach data if API is cold or offline.
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="coaches" className="py-16 sm:py-20" aria-labelledby="coaches-title">
      <div>
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
          {coaches.map((coach, index) => (
            <article
              key={coach.name}
              className="group overflow-hidden rounded-2xl border border-[#e4e5df] bg-white shadow-xs transition-all duration-300 hover:border-[#10110f] hover:shadow-md"
            >
              <div className="relative h-[300px] overflow-hidden bg-neutral-100 sm:h-[340px]">
                <img
                  src={coach.image}
                  alt={`${coach.name}, ${coach.specialty}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 right-3 rounded-xl bg-[#c8f31d] px-2.5 py-1 font-[Barlow_Condensed] text-sm font-black text-[#10110f] shadow-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-[Barlow_Condensed] text-3xl font-bold leading-none text-[#10110f]">
                      {coach.name}
                    </h3>
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#777a73]">
                      {coach.specialty}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 transition-colors group-hover:bg-[#c8f31d]">
                    <ArrowRightIcon className="h-4 w-4 text-[#10110f] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#555750]">{coach.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
