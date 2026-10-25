import { useEffect, useState } from 'react'
import { fetchClasses } from '../api/client.js'
import { classSchedule as fallbackClasses } from '../data/siteData'

// ClassScheduleSection: keeps a real category filter in state and loads live data with graceful offline fallback.
export default function ClassScheduleSection() {
  const [classes, setClasses] = useState(fallbackClasses)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    let isMounted = true

    fetchClasses()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setClasses(data)
        }
      })
      .catch(() => {
        // Fall back gracefully to bundled timetable if API is cold or offline.
      })

    return () => {
      isMounted = false
    }
  }, [])

  const categories = ['All', ...new Set(classes.map((item) => item.category))]

  const filteredClasses =
    selectedCategory === 'All'
      ? classes
      : classes.filter((item) => item.category === selectedCategory)

  return (
    <section id="classes" className="border-t border-[#e4e5df] py-16 sm:py-20" aria-labelledby="classes-title">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
            Small groups, thoughtful programming
          </p>
          <h2 id="classes-title" className="font-[Barlow_Condensed] text-4xl font-bold leading-none tracking-[-0.05em] text-[#10110f] sm:text-5xl lg:text-6xl">
            Your daily line-up<span className="text-[#84ae00]">.</span>
          </h2>
        </div>
        <a href="#contact" className="inline-flex items-center border-b border-[#10110f] pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
          Reserve a class
        </a>
      </div>

      <p className="mb-6 max-w-3xl text-xs leading-7 text-[#555750] sm:text-sm">
        Ten coached sessions run Monday to Friday, with a focused Saturday programme. Class themes rotate through the week; message us to confirm the day’s coach and availability.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedCategory(category)}
              className={[
                'inline-flex cursor-pointer items-center justify-center border px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] transition',
                isActive
                  ? 'border-[#10110f] bg-[#10110f] text-white'
                  : 'border-[#dfe1d9] bg-white text-[#10110f] hover:border-[#10110f]',
              ].join(' ')}
            >
              {category}
            </button>
          )
        })}
      </div>

      {filteredClasses.length === 0 ? (
        <div className="border border-[#e4e5df] bg-[#f8f8f5] px-4 py-8 text-sm text-[#555750]">
          No classes match this filter yet. Try another category.
        </div>
      ) : (
        <div className="overflow-hidden rounded-none border border-[#e4e5df] bg-white">
          <div className="grid grid-cols-[0.65fr_minmax(0,1.8fr)_0.65fr] items-center gap-2 border-b border-[#e4e5df] bg-[#f8f8f5] px-3 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#777a73] sm:grid-cols-[0.8fr_1.8fr_1.6fr_0.7fr] sm:gap-3 sm:px-4">
            <span>Time</span>
            <span>Session</span>
            <span className="hidden sm:block">Focus</span>
            <span>Duration</span>
          </div>

          {filteredClasses.map((item) => (
            <div
              key={`${item.time}-${item.name}`}
              className="grid grid-cols-[0.65fr_minmax(0,1.8fr)_0.65fr] items-center gap-2 border-b border-[#e4e5df] px-3 py-4 text-[10px] text-[#10110f] last:border-b-0 sm:grid-cols-[0.8fr_1.8fr_1.6fr_0.7fr] sm:gap-3 sm:px-4 sm:text-[11px]"
            >
              <span className="font-bold">{item.time}</span>
              <span className="min-w-0 font-bold">
                {item.name}
                <span className="mt-1 inline-block rounded bg-[#f1f2ed] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#10110f] sm:ml-2 sm:mt-0">
                  {item.category}
                </span>
              </span>
              <span className="hidden text-[#555750] sm:block">{item.focus}</span>
              <span className="whitespace-nowrap">{item.duration}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-7 text-[#777a73] sm:text-xs">
        Saturday: strength, conditioning, Pilates and coached run club from 07:00 to 12:00. Sunday: independent gym access by reservation. Classes are capped for coaching quality; book ahead.
      </p>
    </section>
  )
}
