import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, TrendingUp, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Role } from '@msas/shared'

const navItems = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/opportunities', icon: TrendingUp, label: 'Opportunities' },
]

const adminItems = [
  { to: '/app/admin/users', label: 'Users' },
  { to: '/app/admin/configuration', label: 'Configuration' },
]

export function AppShell() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout().catch(() => null)
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link to="/app/dashboard" className="text-xl font-bold tracking-tight">MSAS</Link>
          <p className="text-xs text-blue-200 mt-1">Sales Acceleration Suite</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive ? 'bg-white/20 font-medium' : 'text-blue-100 hover:bg-white/10')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}

          {user?.role === Role.ADMIN && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs text-blue-300 uppercase tracking-wider">Admin</div>
              {adminItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive ? 'bg-white/20 font-medium' : 'text-blue-100 hover:bg-white/10')
                  }
                >
                  <ChevronRight className="h-3 w-3" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-blue-200">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-blue-200 hover:text-white hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
