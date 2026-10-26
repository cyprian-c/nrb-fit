import studioImage from '../../assets/studio-hero.jpg'
import { SparklesIcon, ArrowRightIcon } from './icons.jsx'

// Hero: keeps the original marketing message, proof stats, and CTA structure while using local studio imagery.
export default function Hero() {
  const stats = [
    ['10', 'Daily class slots'],
    ['6', 'Training disciplines'],
    ['1:1', 'Coaching options'],
  ]

  return (
    <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-10 lg:py-14" aria-labelledby="hero-title">
      <div className="min-w-0">
        <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c8f31d]" aria-hidden="true" />
          Personal training, Nairobi
        </p>

        <h1 id="hero-title" className="font-[Barlow_Condensed] text-[5rem] leading-[0.8] tracking-[-0.06em] text-[#10110f] sm:text-[6rem] lg:text-[8rem]">
          Stronger
          <br />
          is a <span className="text-[#84ae00]">feeling.</span>
        </h1>

        <p className="mt-6 max-w-md text-sm leading-7 text-[#50524d]">
          A considered approach to strength, conditioning and recovery. Expert coaching, thoughtful programming, and room to train your way.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <a
            href="#classes"
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#10110f] px-5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
          >
            <span>Explore the schedule</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </a>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777a73]">
            Small-group coaching · Independent gym access
          </p>
        </div>

        <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-[#e4e5df] pt-5">
          {stats.map(([value, label]) => (
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

      <div className="relative min-h-[380px] overflow-hidden rounded-3xl bg-[#f1f2ed] shadow-md sm:min-h-[440px]">
        <img
          src={studioImage}
          alt="Strength training studio with free weights and equipment"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10110f]/35 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute right-4 top-5 flex h-24 w-24 flex-col justify-between rounded-2xl bg-[#c8f31d] p-3 text-[11px] font-extrabold uppercase leading-[1.05] text-[#10110f] shadow-sm">
          <span>Move<br />your<br />way</span>
          <SparklesIcon className="self-end h-5 w-5 text-[#10110f]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-3xl bg-[#10110f]/80 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-xs">
          <span>A little space to get a lot stronger.</span>
          <span className="text-[#c8f31d]">01 / 03</span>
        </div>
      </div>
    </section>
  )
}
