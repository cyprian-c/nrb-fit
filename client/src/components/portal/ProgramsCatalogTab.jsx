import { useState } from 'react'
import { CalendarIcon, ClockIcon, LightningIcon } from '../icons.jsx'

export default function ProgramsCatalogTab({
  programs,
  enrollments,
  onOpenProgram,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All Routines' },
    { id: 'full_body', label: 'Full Body' },
    { id: 'abs', label: 'Abs & Core' },
    { id: 'chest', label: 'Chest & Arms' },
    { id: 'legs', label: 'Lower Body' },
    { id: 'mobility', label: 'Mobility & Recovery' },
  ]

  const enrollmentMap = new Map()
  if (enrollments) {
    for (const e of enrollments) {
      enrollmentMap.set(e.program_id, e)
    }
  }

  const filteredPrograms = (programs || []).filter((prog) => {
    if (selectedCategory === 'all') return true
    return prog.category === selectedCategory
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#84ae00]">
            Home Workout Catalog
          </span>
          <h2 className="mt-1 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-4xl">
            Bodyweight Training Programs
          </h2>
          <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
            Progressive daily training routines inspired by athletic conditioning. No gym machines or bulky gear required.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-xl px-3 text-[10px] font-bold uppercase tracking-[0.14em] shadow-2xs transition-all duration-200 active:scale-[0.98] ${
                selectedCategory === cat.id
                  ? 'border border-[#10110f] bg-[#10110f] text-white shadow-xs'
                  : 'border border-[#e4e5df] bg-white text-[#10110f] hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.map((prog) => {
          const enrollment = enrollmentMap.get(prog.id)
          const isEnrolled = Boolean(enrollment)

          return (
            <div
              key={prog.id}
              className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs transition hover:border-[#10110f] hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: prog.banner_color || '#84ae00' }}
                  >
                    {prog.category.replace('_', ' ')}
                  </span>

                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">
                    {prog.difficulty}
                  </span>
                </div>

                <h3 className="mt-4 font-[Barlow_Condensed] text-2xl font-extrabold uppercase tracking-tight text-[#10110f]">
                  {prog.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  {prog.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5 text-neutral-400" /> {prog.duration_days} Days Total
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5 text-neutral-400" /> 15–25 min/day
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <LightningIcon className="h-3.5 w-3.5 text-[#84ae00]" /> {prog.session_count || 28} Routines
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-4">
                {isEnrolled ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#84ae00]">
                        Active · Day {enrollment.current_day}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenProgram(prog.slug)}
                      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#10110f] px-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
                    >
                      Continue Day {enrollment.current_day} →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenProgram(prog.slug)}
                    className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-xs font-bold uppercase tracking-wider text-[#10110f] shadow-xs transition-all duration-200 hover:border-[#10110f] hover:bg-neutral-50 active:scale-[0.98]"
                  >
                    View Program Schedule & Enroll →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
