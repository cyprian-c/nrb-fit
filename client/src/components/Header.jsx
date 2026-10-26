import { useAuth } from '../context/AuthContext.jsx'

// Header: sleek athletic branding, responsive view switching, and accent-hover interactions.
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
    <header className="sticky top-0 z-40 border-b border-[#e4e5df] bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-8 lg:px-16 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand & View Switcher */}
        <div className="flex items-center gap-5 sm:gap-6">
          <button
            type="button"
            onClick={() => onSelectView && onSelectView('studio')}
            className="group cursor-pointer font-[Barlow_Condensed] text-2xl font-black tracking-tight text-[#10110f] transition sm:text-3xl"
          >
            NRBFIT<span className="text-[#84ae00] transition group-hover:text-[#c8f31d]">.</span>
          </button>

          {/* Studio / Portal Pill Switcher */}
          {user && (
            <div className="hidden rounded-full border border-neutral-200/80 bg-neutral-100/90 p-1 sm:inline-flex shadow-xs">
              <button
                type="button"
                onClick={() => onSelectView && onSelectView('studio')}
                className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  currentView === 'studio'
                    ? 'bg-[#10110f] text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-[#c8f31d] hover:text-[#10110f]'
                }`}
              >
                Studio
              </button>
              <button
                type="button"
                onClick={() => onSelectView && onSelectView('portal')}
                className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  currentView === 'portal'
                    ? 'bg-[#10110f] text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-[#c8f31d] hover:text-[#10110f]'
                }`}
              >
                Member Portal
              </button>
            </div>
          )}
        </div>

        {/* Studio Navigation Links with sleek accent hover underline */}
        {currentView === 'studio' && (
          <nav
            className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.16em] text-[#10110f]/80 md:flex"
            aria-label="Main navigation"
          >
            {[
              { href: '#classes', label: 'Classes' },
              { href: '#programs-teaser', label: 'Home Programs' },
              { href: '#coaches', label: 'Coaches' },
              { href: '#memberships', label: 'Packages' },
              { href: '#contact', label: 'Contact' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative py-1 transition-colors hover:text-[#10110f]"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#c8f31d] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Member Avatar */}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c8f31d] font-[Barlow_Condensed] text-xs font-bold text-[#10110f] shadow-xs ring-1 ring-black/5"
                title={user.full_name || user.email}
              >
                {initials}
              </div>

              <span className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#10110f] lg:inline">
                {firstName}
              </span>

              {/* View Switch Button for Mobile / Direct CTA */}
              {currentView === 'studio' ? (
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('portal')}
                  className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
                >
                  Member Portal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('studio')}
                  className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl border border-neutral-300 bg-white px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f] shadow-xs transition-all duration-200 hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
                >
                  Studio Overview
                </button>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600 shadow-xs transition-all duration-200 hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f] shadow-xs transition-all duration-200 hover:border-[#c8f31d] hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] sm:px-3.5 sm:text-[11px]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] sm:px-4 sm:text-[11px]"
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
