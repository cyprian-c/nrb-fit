import { useState, useEffect } from 'react'
import { fetchProgramDetail, enrollProgram } from '../../api/client.js'
import { CloseIcon, CheckIcon } from '../icons.jsx'

export default function ProgramDetailModal({
  isOpen,
  programSlug,
  enrollment,
  onClose,
  onStartSession,
  onEnrollmentChanged,
}) {
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !programSlug) return

    let isMounted = true

    fetchProgramDetail(programSlug)
      .then((data) => {
        if (isMounted) {
          setProgram(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load program details.')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, programSlug])

  if (!isOpen) return null

  const sessions = program?.sessions || []
  const isEnrolled = Boolean(enrollment)
  const currentDay = enrollment?.current_day || 1

  async function handleEnroll() {
    if (!program?.id) return
    setEnrolling(true)
    try {
      await enrollProgram(program.id)
      if (onEnrollmentChanged) {
        onEnrollmentChanged()
      }
    } catch (err) {
      setError(err.message || 'Enrollment failed.')
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Training Program Details"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e4e5df] bg-white text-[#10110f] shadow-2xl">
        {/* Header with program title and close */}
        <div className="flex items-center justify-between border-b border-[#e4e5df] bg-[#fbfbf8] px-6 py-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: program?.banner_color || '#84ae00' }}
            />
            <span className="font-[Barlow_Condensed] text-sm font-bold uppercase tracking-widest text-[#84ae00]">
              {program?.category || 'Training Routine'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm font-medium text-neutral-500 animate-pulse">
              Loading program schedule & exercises...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : program ? (
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    {program.difficulty}
                  </span>
                  <span className="rounded bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    {program.duration_days} Days Plan
                  </span>
                  <span className="rounded bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    No Equipment
                  </span>
                </div>

                <h2 className="mt-3 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
                  {program.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {program.description}
                </p>
              </div>

              {/* Enrollment CTA Bar */}
              <div className="flex items-center justify-between rounded-xl border border-[#e4e5df] bg-[#f7f8f4] p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#10110f]">
                    {isEnrolled ? `Enrolled · Currently on Day ${currentDay}` : 'Ready to start this program?'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isEnrolled
                      ? 'Follow the daily schedule below or jump into your next routine.'
                      : 'Enroll to track daily progress and maintain your training streak.'}
                  </p>
                </div>
                {!isEnrolled && (
                  <button
                    type="button"
                    disabled={enrolling}
                    onClick={handleEnroll}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#10110f] px-4 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Free'}
                  </button>
                )}
              </div>

              {/* Daily Sessions List */}
              <div className="flex flex-col gap-3">
                <h3 className="font-[Barlow_Condensed] text-lg font-bold uppercase tracking-wider text-neutral-700">
                  Daily Workouts & Routines ({sessions.length})
                </h3>

                <div className="flex flex-col gap-3">
                  {sessions.map((session) => {
                    const isSessionCurrent = isEnrolled && session.day_number === currentDay
                    const isSessionCompleted = isEnrolled && session.day_number < currentDay

                    return (
                      <div
                        key={session.id}
                        className={`rounded-xl border p-4 transition ${
                          isSessionCurrent
                            ? 'border-[#84ae00] bg-[#f8faee]'
                            : 'border-[#e4e5df] bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-lg font-[Barlow_Condensed] text-sm font-bold ${
                                isSessionCompleted
                                  ? 'bg-neutral-200 text-neutral-600'
                                  : isSessionCurrent
                                    ? 'bg-[#c8f31d] text-[#10110f]'
                                    : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {isSessionCompleted ? <CheckIcon className="h-4 w-4" /> : `D${session.day_number}`}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-[Barlow_Condensed] text-lg font-bold uppercase text-[#10110f]">
                                  {session.title}
                                </h4>
                                {isSessionCurrent && (
                                  <span className="rounded bg-[#84ae00] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                                    Today
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500">
                                ~{session.estimated_duration_min} min · {session.exercises?.length || 0} exercises
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onClose()
                              onStartSession(session, program)
                            }}
                            className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-xl px-3.5 text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 active:scale-[0.98] ${
                              isSessionCurrent
                                ? 'bg-[#10110f] text-white hover:bg-[#c8f31d] hover:text-[#10110f]'
                                : 'border border-neutral-300 bg-white text-neutral-800 hover:border-[#10110f] hover:bg-neutral-50'
                            }`}
                          >
                            Start Workout →
                          </button>
                        </div>

                        {/* Exercises List within this session */}
                        {session.exercises && session.exercises.length > 0 && (
                          <div className="mt-3 border-t border-neutral-100 pt-3">
                            <div className="flex flex-wrap gap-1.5">
                              {session.exercises.map((ex) => (
                                <span
                                  key={ex.session_exercise_id}
                                  className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600"
                                >
                                  {ex.name}
                                  <span className="ml-1 text-neutral-400">
                                    ({ex.duration_seconds ? `${ex.duration_seconds}s` : `x${ex.reps || 12}`})
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
