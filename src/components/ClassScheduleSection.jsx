import { classSchedule } from '../data/siteData'

// ClassScheduleSection: preserves the original timetable while rendering from a single data file.
export default function ClassScheduleSection() {
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

      <div className="overflow-hidden rounded-none border border-[#e4e5df] bg-white">
        <div className="grid grid-cols-[0.8fr_1.8fr_1.6fr_0.7fr] items-center border-b border-[#e4e5df] bg-[#f8f8f5] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#777a73]">
          <span>Time</span>
          <span>Session</span>
          <span>Focus</span>
          <span>Duration</span>
        </div>

        {classSchedule.map((item) => (
          <div
            key={`${item.time}-${item.name}`}
            className="grid grid-cols-[0.8fr_1.8fr_1.6fr_0.7fr] items-center gap-3 border-b border-[#e4e5df] px-4 py-4 text-[11px] text-[#10110f] last:border-b-0"
          >
            <span className="font-bold">{item.time}</span>
            <span className="font-bold">
              {item.name}
              <span className="ml-2 inline-block rounded bg-[#f1f2ed] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#10110f]">
                {item.category}
              </span>
            </span>
            <span className="text-[#555750]">{item.focus}</span>
            <span>{item.duration}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] leading-7 text-[#777a73] sm:text-xs">
        Saturday: strength, conditioning, Pilates and coached run club from 07:00 to 12:00. Sunday: independent gym access by reservation. Classes are capped for coaching quality; book ahead.
      </p>
    </section>
  )
}
