import { useAuth } from '../../context/AuthContext.jsx'
import { FlameIcon, BellIcon } from '../icons.jsx'

export default function PortalOverviewTab({
  stats,
  enrollments,
  alerts,
  onOpenProgram,
  onNavigateTab,
  onMarkAlertRead,
}) {
  const { user } = useAuth()
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Athlete'

  const activeEnrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null
  const unreadAlerts = (alerts || []).filter((a) => !a.is_read)

  // Find next session to perform for the active enrollment
  const nextSessionNumber = activeEnrollment ? activeEnrollment.current_day : 1

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e4e5df] bg-gradient-to-br from-[#10110f] via-[#1a1c17] to-[#10110f] p-6 text-white sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#c8f31d] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#c8f31d]">
                Member Performance Dashboard
              </span>
            </div>
            <h1 className="mt-2 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
              Welcome Back, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-xs text-neutral-300 sm:text-sm">
              {stats?.currentStreak > 0
                ? `You're on a ${stats.currentStreak}-day training streak! Keep momentum high with today's routine.`
                : 'Ready for today’s movement? Choose a routine or continue your enrolled program below.'}
            </p>
          </div>

          {/* Quick Streak Highlight */}
          <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm sm:px-6">
            <FlameIcon className="h-8 w-8 text-[#c8f31d]" />
            <div>
              <p className="font-[Barlow_Condensed] text-3xl font-extrabold leading-none text-[#c8f31d]">
                {stats?.currentStreak || 0}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Day Streak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proactive Unread Alert Bar */}
      {unreadAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {unreadAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#c8f31d]/40 bg-[#c8f31d]/10 px-4 py-3 text-xs text-[#10110f]"
            >
              <div className="flex items-center gap-2.5">
                <BellIcon className="h-4 w-4 text-[#84ae00] shrink-0" />
                <div>
                  <strong className="font-semibold">{alert.title}</strong>
                  <span className="mx-1.5 text-neutral-400">·</span>
                  <span className="text-neutral-700">{alert.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMarkAlertRead(alert.id)}
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e4e5df] bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Current Streak
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-[Barlow_Condensed] text-3xl font-extrabold text-[#10110f] sm:text-4xl">
              {stats?.currentStreak || 0}
            </span>
            <span className="text-xs text-neutral-500">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4e5df] bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Workouts Logged
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-[Barlow_Condensed] text-3xl font-extrabold text-[#10110f] sm:text-4xl">
              {stats?.totalWorkouts || 0}
            </span>
            <span className="text-xs text-neutral-500">sessions</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4e5df] bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Active Minutes
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-[Barlow_Condensed] text-3xl font-extrabold text-[#10110f] sm:text-4xl">
              {stats?.totalMinutes || 0}
            </span>
            <span className="text-xs text-neutral-500">mins</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4e5df] bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Calories Burned
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-[Barlow_Condensed] text-3xl font-extrabold text-[#84ae00] sm:text-4xl">
              {stats?.totalCalories || 0}
            </span>
            <span className="text-xs text-neutral-500">kcal</span>
          </div>
        </div>
      </div>

      {/* Today's Action Card */}
      <div className="rounded-2xl border-2 border-[#10110f] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#c8f31d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10110f]">
                Today’s Plan
              </span>
              {activeEnrollment && (
                <span className="text-xs font-semibold text-neutral-500">
                  {activeEnrollment.title} · Day {nextSessionNumber} of {activeEnrollment.duration_days}
                </span>
              )}
            </div>

            <h3 className="font-[Barlow_Condensed] text-2xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-3xl">
              {activeEnrollment
                ? `Day ${nextSessionNumber}: Daily Structured Session`
                : 'Start a Home Workout Program'}
            </h3>

            <p className="max-w-xl text-xs leading-relaxed text-neutral-600 sm:text-sm">
              {activeEnrollment
                ? 'Step into a guided, bodyweight session with live timers, audio coaching beeps, and form tips.'
                : 'Choose from 5 dedicated home workout routines: Full Body, Abs & Core, Chest & Arms, Lower Body, or Mobility Flow.'}
            </p>
          </div>

          <div>
            {activeEnrollment ? (
              <button
                type="button"
                onClick={() => onOpenProgram(activeEnrollment.slug)}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-6 py-3.5 font-[Barlow_Condensed] text-base font-bold uppercase tracking-wider text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
              >
                Launch Day {nextSessionNumber} Workout →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('programs')}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-6 py-3.5 font-[Barlow_Condensed] text-base font-bold uppercase tracking-wider text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
              >
                Explore Programs Catalog →
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar if active enrollment */}
        {activeEnrollment && (
          <div className="mt-6 border-t border-neutral-100 pt-5">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Program Progress</span>
              <span className="font-bold text-[#10110f]">
                {Math.round(((activeEnrollment.current_day - 1) / activeEnrollment.duration_days) * 100)}% Completed
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full bg-[#84ae00] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((activeEnrollment.current_day - 1) / activeEnrollment.duration_days) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Enrolled Programs List */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-[Barlow_Condensed] text-xl font-bold uppercase tracking-wider text-[#10110f]">
            My Training Programs ({enrollments?.length || 0})
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('programs')}
            className="text-xs font-bold uppercase tracking-wider text-[#84ae00] hover:underline"
          >
            Browse All Programs →
          </button>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenProgram(item.slug)}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#e4e5df] bg-white p-5 transition hover:border-[#10110f] hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: item.banner_color || '#84ae00' }}
                    >
                      {item.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">
                      Day {item.current_day} of {item.duration_days}
                    </span>
                  </div>

                  <h4 className="mt-3 font-[Barlow_Condensed] text-xl font-bold uppercase text-[#10110f] group-hover:text-[#84ae00] transition">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500">
                    Difficulty: <span className="capitalize">{item.difficulty}</span> · {item.completed_sessions} sessions logged
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#10110f]">
                  <span>Resume Session</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center">
            <p className="text-sm font-semibold text-neutral-700">No active program enrollments yet.</p>
            <p className="mt-1 text-xs text-neutral-500">
              Select any home workout program to follow structured daily training splits.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('programs')}
              className="mt-4 inline-flex items-center rounded-lg bg-[#10110f] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c8f31d] hover:text-[#10110f]"
            >
              Browse Programs
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
