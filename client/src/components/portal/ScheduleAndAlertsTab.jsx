export default function ScheduleAndAlertsTab({
  bookings,
  enrollments,
  alerts,
  onOpenProgram,
  onMarkAlertRead,
}) {
  const activeEnrollments = enrollments || []
  const userBookings = bookings || []
  const userAlerts = alerts || []

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#84ae00]">
          Integrated Calendar & Reminders
        </span>
        <h2 className="mt-1 font-[Barlow_Condensed] text-3xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-4xl">
          Schedule & Activity Alerts
        </h2>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
          Keep track of your booked in-person studio sessions alongside your scheduled home workout splits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Unified Schedule */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#e4e5df] pb-3">
            <h3 className="font-[Barlow_Condensed] text-2xl font-bold uppercase tracking-wider text-[#10110f]">
              Upcoming Studio Classes ({userBookings.length})
            </h3>
          </div>

          {userBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {userBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-[#e4e5df] bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-[#f0f1ec] font-[Barlow_Condensed] text-xs font-bold text-[#10110f]">
                      <span>{b.booking_date ? new Date(b.booking_date).getDate() : '📅'}</span>
                      <span className="text-[9px] uppercase text-neutral-500">
                        {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short' }) : 'Day'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-[Barlow_Condensed] text-lg font-bold uppercase text-[#10110f]">
                        {b.class_name || 'Studio Session'}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {b.time_slot || '08:00 AM'} · Coach: {b.coach_name || 'Studio Team'}
                      </p>
                    </div>
                  </div>

                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-xs text-neutral-500">
              No studio classes booked yet. You can book upcoming classes in the Studio Overview.
            </div>
          )}

          {/* Home Program Splits Schedule */}
          <div className="flex items-center justify-between border-b border-[#e4e5df] pb-3 pt-4">
            <h3 className="font-[Barlow_Condensed] text-2xl font-bold uppercase tracking-wider text-[#10110f]">
              Active Home Program Schedule
            </h3>
          </div>

          {activeEnrollments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activeEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="flex items-center justify-between rounded-xl border border-[#e4e5df] bg-white p-4 shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#84ae00]">
                      {enr.category}
                    </span>
                    <h4 className="font-[Barlow_Condensed] text-lg font-bold uppercase text-[#10110f]">
                      {enr.title}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Current Day: Day {enr.current_day} of {enr.duration_days}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProgram(enr.slug)}
                    className="cursor-pointer rounded-lg bg-[#10110f] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c8f31d] hover:text-[#10110f]"
                  >
                    Open Day {enr.current_day} →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-xs text-neutral-500">
              No active training programs. Enroll in a program to see daily scheduled workouts.
            </div>
          )}
        </div>

        {/* Right Column: Activity Alerts Center */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#e4e5df] pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-[Barlow_Condensed] text-2xl font-bold uppercase tracking-wider text-[#10110f]">
                Alerts & Reminders
              </h3>
              {userAlerts.some((a) => !a.is_read) && (
                <span className="flex h-2 w-2 rounded-full bg-[#84ae00]" />
              )}
            </div>

            {userAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => onMarkAlertRead('all')}
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-[#84ae00] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {userAlerts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {userAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                    alert.is_read
                      ? 'border-[#e4e5df] bg-[#fbfbf9] text-neutral-700 opacity-80'
                      : 'border-[#84ae00]/40 bg-white text-[#10110f] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-base">
                        {alert.type === 'workout_completed'
                          ? '🏆'
                          : alert.type === 'program_enrolled'
                            ? '🚀'
                            : alert.type === 'class_reminder'
                              ? '🗓'
                              : '🔔'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-[#10110f]">
                          {alert.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    {!alert.is_read && (
                      <button
                        type="button"
                        onClick={() => onMarkAlertRead(alert.id)}
                        className="cursor-pointer text-[10px] font-bold text-neutral-400 hover:text-black"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-100">
                    <span>
                      {alert.created_at
                        ? new Date(alert.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent'}
                    </span>

                    {alert.action_url && (
                      <button
                        type="button"
                        onClick={() => {
                          const slug = alert.action_url.split('/').pop()
                          if (slug) onOpenProgram(slug)
                        }}
                        className="font-bold uppercase tracking-wider text-[#84ae00] hover:underline"
                      >
                        View Program →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-xs text-neutral-500">
              You’re all caught up! No unread notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
