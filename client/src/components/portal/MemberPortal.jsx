import { useState, useEffect, lazy, Suspense } from 'react'
import {
  fetchPortalStats,
  fetchMyEnrollments,
  fetchPrograms,
  fetchAlerts,
  fetchMyBookings,
  markAlertRead,
} from '../../api/client.js'
import PortalOverviewTab from './PortalOverviewTab.jsx'
import ProgramsCatalogTab from './ProgramsCatalogTab.jsx'
import TrainingStatsTab from './TrainingStatsTab.jsx'
import ScheduleAndAlertsTab from './ScheduleAndAlertsTab.jsx'

const ProgramDetailModal = lazy(() => import('./ProgramDetailModal.jsx'))
const WorkoutPlayerModal = lazy(() => import('./WorkoutPlayerModal.jsx'))

export default function MemberPortal({ onBackToStudio }) {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'programs' | 'stats' | 'schedule'
  const [stats, setStats] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [programs, setPrograms] = useState([])
  const [alerts, setAlerts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)

  // Modals state
  const [selectedProgramSlug, setSelectedProgramSlug] = useState(null)
  const [workoutSession, setWorkoutSession] = useState(null)
  const [workoutProgram, setWorkoutProgram] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      fetchPortalStats(),
      fetchMyEnrollments(),
      fetchPrograms(),
      fetchAlerts(),
      fetchMyBookings(),
    ])
      .then(([statsData, enrollmentsData, programsData, alertsData, bookingsData]) => {
        if (!isMounted) return
        if (statsData.status === 'fulfilled') setStats(statsData.value)
        if (enrollmentsData.status === 'fulfilled') setEnrollments(enrollmentsData.value || [])
        if (programsData.status === 'fulfilled') setPrograms(programsData.value || [])
        if (alertsData.status === 'fulfilled') setAlerts(alertsData.value || [])
        if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value || [])
        setLoading(false)
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [refreshIndex])

  function triggerRefresh() {
    setRefreshIndex((idx) => idx + 1)
  }

  async function handleMarkAlertRead(alertId) {
    try {
      await markAlertRead(alertId)
      if (alertId === 'all') {
        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
      } else {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
        )
      }
    } catch {
      // Non-blocking
    }
  }

  function handleStartSession(session, program) {
    setWorkoutSession(session)
    setWorkoutProgram(program)
  }

  function handleWorkoutCompleted() {
    // Refresh stats & enrollments after logging
    triggerRefresh()
  }

  const unreadAlertsCount = alerts.filter((a) => !a.is_read).length

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'programs', label: 'Home Programs' },
    { id: 'stats', label: 'My Analytics' },
    {
      id: 'schedule',
      label: 'Schedule & Alerts',
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
    },
  ]

  const activeEnrollmentForSelected = enrollments.find(
    (e) => e.slug === selectedProgramSlug
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-16">
      {/* Portal Top Bar */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e4e5df] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Barlow_Condensed] text-2xl font-black uppercase tracking-tight text-[#10110f] sm:text-3xl">
              Member Portal
            </h1>
            <span className="rounded-full bg-[#c8f31d] px-2.5 py-0.5 font-[Barlow_Condensed] text-xs font-bold uppercase tracking-wider text-[#10110f]">
              Pro Athlete
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Structured home routines, session tracking, and studio integration.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToStudio}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-xl border border-neutral-300 bg-white px-3 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-[#10110f] shadow-xs transition-all duration-200 hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] whitespace-nowrap leading-none"
        >
          ← Return to Studio Overview
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-[#e4e5df] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative inline-flex h-9 cursor-pointer items-center rounded-xl px-4 font-[Barlow_Condensed] text-sm font-bold uppercase tracking-wider shadow-2xs transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#10110f] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-[#c8f31d] hover:text-[#10110f]'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#84ae00] text-[9px] font-black text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm font-semibold text-neutral-400 animate-pulse">
          Loading your training portal...
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <PortalOverviewTab
              stats={stats}
              enrollments={enrollments}
              alerts={alerts}
              onOpenProgram={(slug) => setSelectedProgramSlug(slug)}
              onNavigateTab={(tabId) => setActiveTab(tabId)}
              onMarkAlertRead={handleMarkAlertRead}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramsCatalogTab
              programs={programs}
              enrollments={enrollments}
              onOpenProgram={(slug) => setSelectedProgramSlug(slug)}
            />
          )}

          {activeTab === 'stats' && <TrainingStatsTab stats={stats} />}

          {activeTab === 'schedule' && (
            <ScheduleAndAlertsTab
              bookings={bookings}
              enrollments={enrollments}
              alerts={alerts}
              onOpenProgram={(slug) => setSelectedProgramSlug(slug)}
              onMarkAlertRead={handleMarkAlertRead}
            />
          )}
        </>
      )}

      {/* Lazy Modals */}
      <Suspense fallback={null}>
        {selectedProgramSlug && (
          <ProgramDetailModal
            isOpen={Boolean(selectedProgramSlug)}
            programSlug={selectedProgramSlug}
            enrollment={activeEnrollmentForSelected}
            onClose={() => setSelectedProgramSlug(null)}
            onStartSession={handleStartSession}
            onEnrollmentChanged={triggerRefresh}
          />
        )}

        {workoutSession && (
          <WorkoutPlayerModal
            key={workoutSession?.id || 'none'}
            isOpen={Boolean(workoutSession)}
            session={workoutSession}
            program={workoutProgram}
            onClose={() => {
              setWorkoutSession(null)
              setWorkoutProgram(null)
            }}
            onWorkoutCompleted={handleWorkoutCompleted}
          />
        )}
      </Suspense>
    </div>
  )
}
