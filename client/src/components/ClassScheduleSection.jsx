import { useEffect, useState } from 'react'
import { createBooking, fetchClasses } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { classSchedule as fallbackClasses } from '../data/siteData'

// ClassScheduleSection: keeps a real category filter in state, loads live data, and supports slot booking.
export default function ClassScheduleSection({ onOpenAuth }) {
  const { user } = useAuth()
  const [classes, setClasses] = useState(fallbackClasses)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [bookedIds, setBookedIds] = useState(() => new Set())
  const [loadingBookingId, setLoadingBookingId] = useState(null)
  const [bookingFeedback, setBookingFeedback] = useState('')

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

  async function handleBook(item, index) {
    const classId = item.id || (index + 1)

    if (!user) {
      setBookingFeedback('Please sign in or create an account to reserve a workout slot.')
      onOpenAuth?.()
      return
    }

    if (bookedIds.has(classId)) return

    setLoadingBookingId(classId)
    setBookingFeedback('')

    try {
      await createBooking({ class_id: classId })
      setBookedIds((prev) => new Set([...prev, classId]))
      setBookingFeedback(`Spot reserved for ${item.name}! Check your email for confirmation.`)
    } catch (err) {
      if (err.message?.includes('already booked')) {
        setBookedIds((prev) => new Set([...prev, classId]))
        setBookingFeedback(`You are already booked into ${item.name}.`)
      } else {
        setBookingFeedback(err.message || 'Unable to complete reservation.')
      }
    } finally {
      setLoadingBookingId(null)
    }
  }

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

      {bookingFeedback && (
        <div
          role="status"
          className="mb-6 border border-[#c8f31d] bg-[#f8f8f5] px-4 py-3 text-xs font-semibold text-[#10110f]"
        >
          {bookingFeedback}
        </div>
      )}

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
          <div className="grid grid-cols-[0.6fr_minmax(0,1.6fr)_0.6fr_auto] items-center gap-2 border-b border-[#e4e5df] bg-[#f8f8f5] px-3 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#777a73] sm:grid-cols-[0.7fr_1.6fr_1.4fr_0.6fr_auto] sm:gap-3 sm:px-4">
            <span>Time</span>
            <span>Session</span>
            <span className="hidden sm:block">Focus</span>
            <span>Duration</span>
            <span className="text-right">Action</span>
          </div>

          {filteredClasses.map((item, index) => {
            const classId = item.id || (index + 1)
            const isBooked = bookedIds.has(classId)
            const isLoading = loadingBookingId === classId

            return (
              <div
                key={`${item.time}-${item.name}`}
                className="grid grid-cols-[0.6fr_minmax(0,1.6fr)_0.6fr_auto] items-center gap-2 border-b border-[#e4e5df] px-3 py-4 text-[10px] text-[#10110f] last:border-b-0 sm:grid-cols-[0.7fr_1.6fr_1.4fr_0.6fr_auto] sm:gap-3 sm:px-4 sm:text-[11px]"
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
                <div className="text-right">
                  <button
                    type="button"
                    disabled={isBooked || isLoading}
                    onClick={() => handleBook(item, index)}
                    className={[
                      'inline-flex min-h-[32px] cursor-pointer items-center justify-center px-3 text-[9px] font-bold uppercase tracking-[0.14em] transition',
                      isBooked
                        ? 'cursor-default bg-[#f1f2ed] text-[#719500]'
                        : 'bg-[#10110f] text-white hover:bg-[#c8f31d] hover:text-[#10110f]',
                      isLoading ? 'opacity-60 cursor-wait' : '',
                    ].join(' ')}
                    aria-label={`Book ${item.name} at ${item.time}`}
                  >
                    {isLoading ? 'Booking...' : isBooked ? 'Booked ✓' : 'Book'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-7 text-[#777a73] sm:text-xs">
        Saturday: strength, conditioning, Pilates and coached run club from 07:00 to 12:00. Sunday: independent gym access by reservation. Classes are capped for coaching quality; book ahead.
      </p>
    </section>
  )
}
