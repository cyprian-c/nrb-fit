import { FlameIcon, DumbbellIcon, ClockIcon, LightningIcon, CheckIcon } from '../icons.jsx'

export default function TrainingStatsTab({ stats }) {
  const activeDaysSet = new Set(stats?.activeDays || [])

  // Build past 35 days (5 weeks) for calendar heatmap
  const daysList = []
  const today = new Date()
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfMonth = d.getDate()
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    daysList.push({
      dateStr,
      dayOfMonth,
      dayName,
      isCompleted: activeDaysSet.has(dateStr),
      isToday: i === 0,
    })
  }

  const categoryDistribution = stats?.categoryDistribution || []
  const totalCategoryWorkouts = categoryDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#84ae00]">
          Consistency & Tracking
        </span>
        <h2 className="mt-1 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-4xl">
          Personal Training Analytics
        </h2>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
          Keep track of your training cadence, lifetime volume, and body focus distribution over time.
        </p>
      </div>

      {/* Main Stats Counters */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Current Streak
            </span>
            <FlameIcon className="h-6 w-6 text-[#c8f31d]" />
          </div>
          <div className="mt-4">
            <p className="font-[Barlow_Condensed] text-4xl font-black text-[#10110f] sm:text-5xl">
              {stats?.currentStreak || 0}
            </p>
            <p className="mt-1 text-xs text-neutral-500">consecutive days</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Total Workouts
            </span>
            <DumbbellIcon className="h-6 w-6 text-[#10110f]" />
          </div>
          <div className="mt-4">
            <p className="font-[Barlow_Condensed] text-4xl font-black text-[#10110f] sm:text-5xl">
              {stats?.totalWorkouts || 0}
            </p>
            <p className="mt-1 text-xs text-neutral-500">sessions completed</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Active Time
            </span>
            <ClockIcon className="h-6 w-6 text-neutral-600" />
          </div>
          <div className="mt-4">
            <p className="font-[Barlow_Condensed] text-4xl font-black text-[#10110f] sm:text-5xl">
              {stats?.totalMinutes || 0}
            </p>
            <p className="mt-1 text-xs text-neutral-500">minutes trained</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Est. Energy
            </span>
            <LightningIcon className="h-6 w-6 text-[#84ae00]" />
          </div>
          <div className="mt-4">
            <p className="font-[Barlow_Condensed] text-4xl font-black text-[#84ae00] sm:text-5xl">
              {stats?.totalCalories || 0}
            </p>
            <p className="mt-1 text-xs text-neutral-500">calories burned</p>
          </div>
        </div>
      </div>

      {/* 35-Day Consistency Heatmap Grid */}
      <div className="rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-[Barlow_Condensed] text-xl font-bold uppercase tracking-wider text-[#10110f]">
              Activity Calendar (Last 35 Days)
            </h3>
            <p className="text-xs text-neutral-500">
              Green tiles represent days with completed home workouts or studio sessions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span className="h-3 w-3 rounded-xs bg-[#e9ebe3]" /> Rest Day
            <span className="ml-2 h-3 w-3 rounded-xs bg-[#84ae00]" /> Trained
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
          {daysList.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.isCompleted ? 'Workout Completed' : 'Rest'}`}
              className={`flex flex-col items-center justify-center rounded-xl p-2.5 sm:p-3 transition ${
                day.isCompleted
                  ? 'border border-[#84ae00] bg-[#84ae00] text-white shadow-xs'
                  : 'border border-[#e4e5df] bg-[#f6f7f3] text-neutral-600'
              } ${day.isToday ? 'ring-2 ring-[#10110f] ring-offset-1' : ''}`}
            >
              <span className="text-[9px] font-semibold uppercase opacity-75">
                {day.dayName}
              </span>
              <span className="font-[Barlow_Condensed] text-lg font-bold leading-tight">
                {day.dayOfMonth}
              </span>
              <span className="mt-0.5 flex items-center justify-center text-[8px] font-bold uppercase">
                {day.isCompleted ? <CheckIcon className="h-3 w-3" /> : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-xs sm:p-8">
        <h3 className="font-[Barlow_Condensed] text-xl font-bold uppercase tracking-wider text-[#10110f]">
          Muscle Focus & Category Split
        </h3>
        <p className="text-xs text-neutral-500">
          Distribution of training volume across body target areas.
        </p>

        {categoryDistribution.length > 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            {categoryDistribution.map((item) => {
              const pct = Math.round((item.count / totalCategoryWorkouts) * 100)
              return (
                <div key={item.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#10110f]">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-neutral-500">
                      {item.count} sessions ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full bg-[#84ae00] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-neutral-50 p-6 text-center text-xs text-neutral-500">
            Log your first workout to see your muscle category split.
          </div>
        )}
      </div>
    </div>
  )
}
