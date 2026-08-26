import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Award,
  Briefcase,
  ExternalLink,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/components/ui/Primitives';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/profile', label: 'Hero / Profile', icon: User },
  { to: '/admin/services', label: 'Services', icon: Sparkles },
  { to: '/admin/projects', label: 'Projects', icon: Briefcase },
  { to: '/admin/certifications', label: 'Studies & Certs', icon: GraduationCap },
  { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
  { to: '/admin/awards', label: 'Awards', icon: Award },
];

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { notify } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative min-h-dvh bg-ink-950">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[26rem] w-[26rem] rounded-full bg-accent-600/8 blur-[120px]" />
      </div>

      {/* Mobile bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/8 bg-ink-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <span className="text-sm font-bold text-white">Admin Portal</span>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="rounded-lg border border-white/10 p-2 text-slate-300"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-dvh w-[16rem] flex-col border-r border-white/8',
          'bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 pb-4 pt-6">
          <p className="text-sm font-bold text-white">Admin Portal</p>
          <p className="truncate text-[0.7rem] text-violet-300">
            {user?.email ?? ''}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3" aria-label="Admin sections">
          <ul className="space-y-1">
            {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'gradient-surface text-white'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                    )
                  }
                >
                  <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-white/8 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View portfolio
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              notify('success', 'Signed out.');
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="relative px-4 pb-16 pt-20 sm:px-6 lg:ml-[16rem] lg:pt-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
