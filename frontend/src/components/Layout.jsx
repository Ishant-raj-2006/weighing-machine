import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconDashboard, IconScale, IconPlus, IconHistory, IconUsers, IconLogout } from './icons'

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/instruments', label: 'Instruments', icon: IconScale },
  { to: '/tests/new', label: 'New Test', icon: IconPlus },
  { to: '/reports', label: 'Report History', icon: IconHistory },
]

const ROLE_LABELS = {
  admin: 'Administrator',
  lab_manager: 'Lab Manager',
  testing_officer: 'Testing Officer',
  reviewer: 'Reviewer',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-line bg-ink text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="font-display text-lg font-semibold tracking-tight">NAWI Reports</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-brassLight">
            OIML R-76 Test System
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-brass bg-white/10 text-white font-medium'
                    : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-brass bg-white/10 text-white font-medium'
                    : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <IconUsers />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-4 text-xs text-white/50">
          Smart India Hackathon 2026
          <br />
          PS 26035 — DoCA
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3">
          <div className="text-sm text-steel">
            Legal Metrology &middot; Non-Automatic Weighing Instruments
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-ink">{user?.full_name}</div>
              <div className="text-xs text-steel">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            <button onClick={handleLogout} className="btn-outline !px-3 !py-1.5" title="Log out">
              <IconLogout />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-canvas p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
