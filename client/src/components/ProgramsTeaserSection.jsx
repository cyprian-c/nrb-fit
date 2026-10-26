import { useAuth } from '../context/AuthContext.jsx'
import { ArrowRightIcon, SparklesIcon } from './icons.jsx'

export default function ProgramsTeaserSection({ onOpenPortal, onOpenAuth }) {
  const { user } = useAuth()

  const samplePrograms = [
    {
      title: 'Full Body Blitz',
      category: 'Full Body',
      days: '28 Days',
      color: '#84ae00',
      difficulty: 'Intermediate',
      desc: 'Progressive strength & cardio intervals with zero gear.',
    },
    {
      title: 'Abs & Core Shred',
      category: 'Core',
      days: '21 Days',
      color: '#0ea5e9',
      difficulty: 'All Levels',
      desc: 'Targeted plank sequences, mountain climbers, and isometric hollow holds.',
    },
    {
      title: 'Chest & Arms Power',
      category: 'Upper Body',
      days: '28 Days',
      color: '#f97316',
      difficulty: 'Intermediate',
      desc: 'Push variations, tricep dips, and upper-body explosive power.',
    },
    {
      title: 'Legs & Glutes Sculpt',
      category: 'Lower Body',
      days: '28 Days',
      color: '#eab308',
      difficulty: 'Intermediate',
      desc: 'Quad burners, glute bridges, lunges, and plyometric jump mechanics.',
    },
    {
      title: 'Mobility & Morning Flow',
      category: 'Recovery',
      days: '14 Days',
      color: '#10b981',
      difficulty: 'Beginner',
      desc: 'Guided restorative flows to loosen hips, shoulders, and spine.',
    },
  ]

  function handleAction() {
    if (user) {
      onOpenPortal()
    } else {
      onOpenAuth()
    }
  }

  return (
    <section id="programs-teaser" className="py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-4 border-b border-[#e4e5df] pb-6 md:flex-row md:items-end">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#84ae00]">
            Home & Remote Training
          </span>
          <h2 className="mt-1 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-4xl">
            Structured Home Workout Programs
          </h2>
          <p className="mt-2 max-w-2xl text-xs text-neutral-600 sm:text-sm">
            Whether traveling or training at home, follow day-by-day bodyweight splits with our interactive live workout player, audio countdown cues, and streak analytics in the Member Portal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAction}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 self-start rounded-xl bg-[#10110f] px-4 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
        >
          <span>{user ? 'Enter Member Portal' : 'Sign In for Portal Access'}</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {samplePrograms.map((prog) => (
          <div
            key={prog.title}
            className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#10110f] hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="rounded-md px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: prog.color }}
                >
                  {prog.category}
                </span>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-600">
                  {prog.days} · {prog.difficulty}
                </span>
              </div>

              <h3 className="mt-4 font-[Barlow_Condensed] text-2xl font-bold uppercase tracking-tight text-[#10110f]">
                {prog.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                {prog.desc}
              </p>
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={handleAction}
                className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#84ae00] hover:text-[#10110f] transition-colors"
              >
                <span>Access in Portal</span>
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Highlight Card for Member Portal */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#10110f] bg-[#10110f] p-6 text-white shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#c8f31d] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#10110f]">
              <SparklesIcon className="h-3 w-3" />
              <span>Interactive Experience</span>
            </div>
            <h3 className="mt-4 font-[Barlow_Condensed] text-2xl font-black uppercase text-white">
              Guided Workout Player
            </h3>
            <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
              Voice beeps, rest timers, form tips, and streak tracking that automatically saves to your personal profile.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="mt-6 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#c8f31d] px-4 font-[Barlow_Condensed] text-xs font-black uppercase tracking-wider text-[#10110f] shadow-xs transition-all duration-200 hover:bg-[#b8e314] active:scale-[0.98]"
          >
            <span>Launch Player in Portal</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  )
}
