import { useAuth } from '../context/AuthContext.jsx'

// Header: keeps the studio branding, in-page navigation, and authentication state anchored.
export default function Header({ onOpenAuth, onOpenBookings }) {
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
    <header className="border-b border-[#e4e5df] bg-white/95 px-6 py-5 backdrop-blur-sm sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a href="#top" className="font-[Barlow_Condensed] text-3xl font-extrabold tracking-tight text-[#10110f]">
          NRBFIT<span className="text-[#84ae00]">.</span>
        </a>

        <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#10110f] md:flex" aria-label="Main navigation">
          <a href="#classes" className="transition hover:opacity-70">Classes</a>
          <a href="#coaches" className="transition hover:opacity-70">Coaches</a>
          <a href="#memberships" className="transition hover:opacity-70">Packages</a>
          <a href="#contact" className="transition hover:opacity-70">Contact</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8f31d] font-[Barlow_Condensed] text-sm font-bold text-[#10110f]"
                title={user.full_name || user.email}
              >
                {initials}
              </div>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#10110f] sm:inline">
                Hi, {firstName}
              </span>
              {onOpenBookings && (
                <button
                  type="button"
                  onClick={onOpenBookings}
                  className="inline-flex items-center border border-[#10110f] bg-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f] transition hover:bg-[#f6f7f3]"
                >
                  My Bookings
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center bg-[#10110f] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f]"
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
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-[#10110f] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f] sm:text-[11px]"
              >
                Book a visit
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
