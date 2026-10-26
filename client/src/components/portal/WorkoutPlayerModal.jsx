import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  playCountdownBeep,
  playStartBeep,
  playRestBeep,
  playCelebrationChime,
} from '../../utils/audioCues.js'
import { logWorkoutSession } from '../../api/client.js'
import {
  VolumeUpIcon,
  VolumeMuteIcon,
  CloseIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  FlameIcon,
  PlayIcon,
  PauseIcon,
} from '../icons.jsx'

export default function WorkoutPlayerModal({
  isOpen,
  session,
  program,
  onClose,
  onWorkoutCompleted,
}) {
  const [phase, setPhase] = useState('preview') // 'preview' | 'ready' | 'exercise' | 'rest' | 'finished'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [completionStats, setCompletionStats] = useState(null)

  const exercises = useMemo(() => session?.exercises || [], [session])
  const currentExercise = exercises[currentIdx] || null
  const nextExercise = exercises[currentIdx + 1] || null

  const totalTimerRef = useRef(null)

  // Total workout elapsed timer (runs when active in ready/exercise/rest)
  useEffect(() => {
    if (isOpen && (phase === 'ready' || phase === 'exercise' || phase === 'rest') && !isPaused) {
      totalTimerRef.current = setInterval(() => {
        setTotalElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(totalTimerRef.current)
    }
    return () => clearInterval(totalTimerRef.current)
  }, [isOpen, phase, isPaused])

  // Finish and save workout
  const finishWorkout = useCallback(async () => {
    setPhase('finished')
    if (soundEnabled) playCelebrationChime()

    const finalDuration = Math.max(1, totalElapsed)
    const estimatedCalories = Math.max(15, Math.round((finalDuration / 60) * 8.5))
    setCompletionStats({
      durationSeconds: finalDuration,
      caloriesBurned: estimatedCalories,
    })

    setIsSaving(true)
    try {
      const payload = {
        title: session?.title || `${program?.title || 'Home'} Workout`,
        duration_seconds: finalDuration,
        calories_burned: estimatedCalories,
        program_id: program?.id || null,
        session_id: session?.id || null,
      }
      const response = await logWorkoutSession(payload)
      if (onWorkoutCompleted) {
        onWorkoutCompleted(response)
      }
    } catch (err) {
      setSaveError(err.message || 'Could not save workout log.')
    } finally {
      setIsSaving(false)
    }
  }, [totalElapsed, session, program, soundEnabled, onWorkoutCompleted])

  // Move to Next Exercise or Rest
  const handleExerciseDone = useCallback(() => {
    if (currentIdx < exercises.length - 1) {
      const restDuration = currentExercise?.rest_after_seconds || 30
      setPhase('rest')
      setSecondsLeft(restDuration)
      if (soundEnabled) playRestBeep()
    } else {
      finishWorkout()
    }
  }, [currentIdx, exercises.length, currentExercise, soundEnabled, finishWorkout])

  // Phase Countdown Timers (async callbacks only to prevent set-state-in-effect)
  useEffect(() => {
    if (!isOpen || isPaused) return

    if (phase === 'ready') {
      const timer = setTimeout(() => {
        if (secondsLeft > 1) {
          if (soundEnabled && secondsLeft <= 3) playCountdownBeep()
          setSecondsLeft((prev) => prev - 1)
        } else {
          setPhase('exercise')
          if (soundEnabled) playStartBeep()
          setSecondsLeft(currentExercise?.duration_seconds || 0)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (phase === 'exercise' && currentExercise?.duration_seconds) {
      const timer = setTimeout(() => {
        if (secondsLeft > 1) {
          if (soundEnabled && secondsLeft <= 4) playCountdownBeep()
          setSecondsLeft((prev) => prev - 1)
        } else {
          handleExerciseDone()
        }
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (phase === 'rest') {
      const timer = setTimeout(() => {
        if (secondsLeft > 1) {
          if (soundEnabled && secondsLeft <= 3) playCountdownBeep()
          setSecondsLeft((prev) => prev - 1)
        } else {
          setCurrentIdx((prev) => prev + 1)
          setPhase('exercise')
          if (soundEnabled) playStartBeep()
          const nextEx = exercises[currentIdx + 1]
          setSecondsLeft(nextEx?.duration_seconds || 0)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [
    isOpen,
    phase,
    secondsLeft,
    isPaused,
    soundEnabled,
    currentExercise,
    exercises,
    currentIdx,
    handleExerciseDone,
  ])

  if (!isOpen || !session) return null

  function startWorkout() {
    setPhase('ready')
    setSecondsLeft(5)
    if (soundEnabled) playCountdownBeep()
  }

  function skipRest() {
    setCurrentIdx((prev) => prev + 1)
    setPhase('exercise')
    if (soundEnabled) playStartBeep()
    const nextEx = exercises[currentIdx + 1]
    setSecondsLeft(nextEx?.duration_seconds || 0)
  }

  function addRest20() {
    setSecondsLeft((prev) => prev + 20)
  }

  function formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleClose = () => {
    if (phase === 'exercise' || phase === 'rest') {
      const confirmExit = window.confirm(
        'Workout in progress! Are you sure you want to stop? Progress on this session will not be saved.'
      )
      if (!confirmExit) return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Workout Session Player"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#121310] text-white shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-[Barlow_Condensed] text-xl font-extrabold tracking-wider text-[#c8f31d]">
              NRBFIT
            </span>
            <span className="text-neutral-500">/</span>
            <span className="max-w-[200px] truncate text-xs font-semibold uppercase tracking-wider text-neutral-300 sm:max-w-xs">
              {session.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg border border-neutral-700 bg-neutral-900/80 p-2 text-xs text-neutral-300 transition hover:bg-neutral-800"
              title={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
            >
              {soundEnabled ? (
                <span className="inline-flex items-center gap-1.5">
                  <VolumeUpIcon className="h-3.5 w-3.5" /> Sound On
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <VolumeMuteIcon className="h-3.5 w-3.5" /> Muted
                </span>
              )}
            </button>

            {/* Total Duration Timer */}
            {(phase === 'exercise' || phase === 'rest') && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 font-mono text-xs font-bold text-neutral-300">
                <ClockIcon className="h-3.5 w-3.5 text-neutral-400" />
                {formatTime(totalElapsed)}
              </span>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Close workout player"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Based on Phase */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-8">
          {/* Phase 1: Preview */}
          {phase === 'preview' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#c8f31d]">
                  Day {session.day_number} Workout
                </span>
                <h2 className="font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                  {session.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  Estimated duration: ~{session.estimated_duration_min} minutes · {exercises.length} exercises · No equipment needed
                </p>
              </div>

              {/* Exercise Checklist Preview */}
              <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Exercises in this routine ({exercises.length})
                </h4>
                <div className="divide-y divide-neutral-800/80">
                  {exercises.map((item, idx) => (
                    <div key={item.session_exercise_id || idx} className="flex items-center justify-between py-2.5 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[10px] text-neutral-400 capitalize">{item.target_muscle}</p>
                        </div>
                      </div>
                      <span className="font-mono text-neutral-300">
                        {item.duration_seconds
                          ? `${item.duration_seconds}s`
                          : `x${item.reps || 12}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={startWorkout}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c8f31d] py-3.5 text-center font-[Barlow_Condensed] text-lg font-black uppercase tracking-wider text-[#10110f] transition hover:bg-[#b5dc15] active:scale-[0.99]"
              >
                <span>Start Workout Now</span>
                <FlameIcon className="h-5 w-5 text-[#10110f]" />
              </button>
            </div>
          )}

          {/* Phase 2: Ready Countdown */}
          {phase === 'ready' && (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#c8f31d]">
                Get Ready
              </span>
              <div className="my-6 flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#c8f31d] bg-[#c8f31d]/10 font-[Barlow_Condensed] text-7xl font-extrabold text-[#c8f31d] animate-pulse">
                {secondsLeft}
              </div>
              <h3 className="font-[Barlow_Condensed] text-2xl font-bold uppercase tracking-wide text-white">
                First Up: {currentExercise?.name}
              </h3>
              <p className="mt-1 text-xs text-neutral-400">
                Target: {currentExercise?.target_muscle}
              </p>
            </div>
          )}

          {/* Phase 3: Active Exercise */}
          {phase === 'exercise' && currentExercise && (
            <div className="flex flex-1 flex-col justify-between gap-6">
              {/* Exercise Progress Top Indicator */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider">
                    Exercise {currentIdx + 1} of {exercises.length}
                  </span>
                  <span className="font-mono text-[11px] text-[#c8f31d]">
                    {Math.round(((currentIdx + 1) / exercises.length) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-[#c8f31d] transition-all duration-300"
                    style={{
                      width: `${((currentIdx + 1) / exercises.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Main Exercise Card */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded bg-neutral-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c8f31d]">
                    {currentExercise.target_muscle}
                  </span>
                  <span className="rounded bg-neutral-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {currentExercise.equipment || 'No Equipment'}
                  </span>
                </div>

                <h3 className="font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                  {currentExercise.name}
                </h3>

                {/* Duration Timer or Rep Counter */}
                {currentExercise.duration_seconds ? (
                  <div className="my-6 flex flex-col items-center">
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#c8f31d] bg-neutral-900/90 font-mono text-5xl font-black text-white shadow-lg">
                      {secondsLeft}s
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSecondsLeft((s) => Math.max(0, s - 5))}
                        className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      >
                        -5s
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPaused(!isPaused)}
                        className="rounded border border-neutral-700 bg-neutral-800 px-4 py-1 text-xs font-bold text-white hover:bg-neutral-700"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isPaused ? <PlayIcon className="h-3 w-3" /> : <PauseIcon className="h-3 w-3" />}
                          {isPaused ? 'Resume' : 'Pause'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecondsLeft((s) => s + 5)}
                        className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      >
                        +5s
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="my-6 flex flex-col items-center">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#c8f31d] bg-neutral-900 font-[Barlow_Condensed] text-5xl font-black text-[#c8f31d]">
                      x{currentExercise.reps || 12}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">
                      Reps Target
                    </p>
                  </div>
                )}

                {/* Instructions & Coaching Form Tips */}
                <div className="max-w-lg rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-left">
                  <p className="text-xs leading-relaxed text-neutral-300">
                    <strong className="text-white">Form: </strong>
                    {currentExercise.instructions}
                  </p>
                  {currentExercise.tips && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#c8f31d]/90">
                      <SparklesIcon className="h-3.5 w-3.5 shrink-0 text-[#c8f31d]" />
                      <span><strong>Coach tip: </strong>{currentExercise.tips}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="flex items-center justify-between gap-4 border-t border-neutral-800 pt-4">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => {
                    setCurrentIdx((prev) => Math.max(0, prev - 1))
                    const prevEx = exercises[currentIdx - 1]
                    setSecondsLeft(prevEx?.duration_seconds || 0)
                  }}
                  className="rounded-lg border border-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-400 disabled:opacity-30 hover:bg-neutral-800 hover:text-white"
                >
                  ← Prev
                </button>

                <button
                  type="button"
                  onClick={handleExerciseDone}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c8f31d] py-3 text-center font-[Barlow_Condensed] text-base font-black uppercase tracking-wider text-[#10110f] transition hover:bg-[#b5dc15]"
                >
                  <span>{currentIdx === exercises.length - 1 ? 'Finish Workout' : 'Done / Next Exercise'}</span>
                  {currentIdx === exercises.length - 1 ? (
                    <TrophyIcon className="h-4 w-4 text-[#10110f]" />
                  ) : (
                    <span>→</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: Rest Interval */}
          {phase === 'rest' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#c8f31d]">
                Rest & Catch Your Breath
              </span>

              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-neutral-700 bg-neutral-900 font-mono text-5xl font-black text-[#c8f31d]">
                {secondsLeft}s
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addRest20}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700"
                >
                  +20s Rest
                </button>
                <button
                  type="button"
                  onClick={skipRest}
                  className="rounded-lg bg-[#c8f31d] px-6 py-2 text-xs font-black uppercase tracking-wider text-[#10110f] hover:bg-[#b5dc15]"
                >
                  Skip Rest →
                </button>
              </div>

              {nextExercise && (
                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Next Up ({currentIdx + 2} of {exercises.length})
                  </span>
                  <h4 className="mt-1 font-[Barlow_Condensed] text-xl font-bold uppercase text-white">
                    {nextExercise.name}
                  </h4>
                  <p className="text-xs text-neutral-400">
                    {nextExercise.duration_seconds
                      ? `${nextExercise.duration_seconds} Seconds`
                      : `${nextExercise.reps || 12} Repetitions`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Workout Finished & Celebrations */}
          {phase === 'finished' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c8f31d]/20">
                <TrophyIcon className="h-10 w-10 text-[#c8f31d]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#c8f31d]">
                  Workout Completed
                </span>
                <h3 className="font-[Barlow_Condensed] text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
                  Sensational Effort!
                </h3>
                <p className="mt-1 text-sm text-neutral-300">
                  {session.title}
                </p>
              </div>

              {/* Stats Showcase */}
              <div className="grid w-full max-w-md grid-cols-2 gap-4">
                <div className="flex flex-col items-center rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Total Time
                  </span>
                  <span className="mt-1 font-mono text-2xl font-bold text-white">
                    {formatTime(completionStats?.durationSeconds || totalElapsed)}
                  </span>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Est. Calories
                  </span>
                  <span className="mt-1 font-mono text-2xl font-bold text-[#c8f31d]">
                    ~{completionStats?.caloriesBurned || 45} kcal
                  </span>
                </div>
              </div>

              {isSaving && (
                <p className="text-xs text-neutral-400 animate-pulse">
                  Saving workout to your member profile...
                </p>
              )}

              {saveError && (
                <div className="rounded-lg bg-red-950/50 p-3 text-xs text-red-300">
                  {saveError}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-md cursor-pointer rounded-xl bg-[#c8f31d] py-3.5 font-[Barlow_Condensed] text-base font-black uppercase tracking-wider text-[#10110f] transition hover:bg-[#b5dc15]"
              >
                Back to Member Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
