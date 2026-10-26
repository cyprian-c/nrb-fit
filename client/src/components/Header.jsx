import { useAuth } from '../context/AuthContext.jsx'

// Header: keeps the studio branding, in-page navigation, and authentication state anchored.
export default function Header({ onOpenAuth, currentView = 'studio', onSelectView }) {
  const { user, logout } = useAuth()

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Member'
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'M'

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e5df] bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectView && onSelectView('studio')}
            className="cursor-pointer font-[Barlow_Condensed] text-3xl font-extrabold tracking-tight text-[#10110f]"
          >
            NRBFIT<span className="text-[#84ae00]">.</span>
          </button>

          {/* View Indicator Badge */}
          {user && (
            <div className="hidden rounded-full border border-neutral-200 bg-neutral-100 p-0.5 sm:inline-flex">
              <button
                type="button"
                onClick={() => onSelectView && onSelectView('studio')}
                className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  currentView === 'studio'
                    ? 'bg-[#10110f] text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Studio
              </button>
              <button
                type="button"
                onClick={() => onSelectView && onSelectView('portal')}
                className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  currentView === 'portal'
                    ? 'bg-[#10110f] text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Member Portal
              </button>
            </div>
          )}
        </div>

        {currentView === 'studio' && (
          <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#10110f] md:flex" aria-label="Main navigation">
            <a href="#classes" className="transition hover:opacity-70">Classes</a>
            <a href="#programs-teaser" className="transition hover:opacity-70">Home Programs</a>
            <a href="#coaches" className="transition hover:opacity-70">Coaches</a>
            <a href="#memberships" className="transition hover:opacity-70">Packages</a>
            <a href="#contact" className="transition hover:opacity-70">Contact</a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8f31d] font-[Barlow_Condensed] text-sm font-bold text-[#10110f]"
                title={user.full_name || user.email}
              >
                {initials}
              </div>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#10110f] lg:inline">
                Hi, {firstName}
              </span>

              {/* View Switch Button for Mobile / Quick Access */}
              {currentView === 'studio' ? (
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('portal')}
                  className="inline-flex cursor-pointer items-center rounded-lg bg-[#c8f31d] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#b8e314]"
                >
                  Member Portal ⚡
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('studio')}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-[#10110f] bg-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#10110f] hover:text-white"
                >
                  Studio Overview
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="inline-flex cursor-pointer items-center rounded-lg bg-[#10110f] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-neutral-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex cursor-pointer items-center justify-center border border-[#10110f] bg-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#10110f] hover:text-white sm:text-[11px]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#10110f] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f] sm:text-[11px]"
              >
                Member Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
