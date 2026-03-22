import { ReactNode, useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Settings, Shield, LogOut, Activity,
  Key, Bell, BarChart3, GitBranch, Bug, ChevronRight, Zap, Globe, BookOpen,
  Menu, X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Logo } from './ui';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Settings',  to: '/settings',  icon: <Settings className="w-4 h-4" /> },
  { label: 'API Keys',  to: '/account/keys', icon: <Key className="w-4 h-4" /> },
  { label: 'Alerts',    to: '/alerts',    icon: <Bell className="w-4 h-4" /> },
  { label: 'My App',    to: '/account/app', icon: <Globe className="w-4 h-4" /> },
  { label: 'Learn',     to: '/learn',     icon: <BookOpen className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { label: 'Admin Panel', to: '/admin', icon: <Shield className="w-4 h-4" />, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">

      {/* ── Mobile dim overlay ───────────────────────────────── */}
      <div
        className={clsx('sidebar-overlay', sidebarOpen && 'open')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={clsx('sidebar', sidebarOpen && 'open')}>
        {/* Logo + close button on mobile */}
        <div className="px-5 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
          <Link to="/dashboard"><Logo size="sm" /></Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-md text-[var(--c-text3)] hover:bg-[var(--c-surface2)]"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {mainNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx('nav-link', isActive && 'active')}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <p className="nav-section mt-4">Admin</p>
              {adminNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => clsx('nav-link', isActive && 'active')}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <p className="nav-section mt-4">Resources</p>
          <a href="/docs" className="nav-link">
            <Zap className="w-4 h-4" />
            Documentation
            <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
          </a>
          <a href="/status" className="nav-link">
            <Activity className="w-4 h-4" />
            Status
            <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
          </a>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-[var(--c-border)] pt-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-[var(--c-blue)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--c-text)] truncate">{user?.name}</p>
              <p className="text-[11px] text-[var(--c-text3)] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-[var(--c-surface2)] text-[var(--c-text3)] hover:text-[var(--c-text)] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Right side: mobile topbar + page content ─────────── */}
      <div className="shell-body">
        {/* Mobile topbar — hamburger + logo */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-[var(--c-text2)] hover:bg-[var(--c-surface2)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard"><Logo size="sm" /></Link>
          {/* Avatar shortcut on mobile */}
          <div className="w-7 h-7 rounded-full bg-[var(--c-blue)] text-white text-xs font-semibold flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 min-w-0 bg-[var(--c-bg)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Per-app sub-navigation used by monitoring pages */
export function AppSubNav({ clientId, appName }: { clientId: string; appName?: string }) {
  const tabs = [
    { label: 'Overview',    to: `/app-monitoring/${clientId}`,   icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: 'Errors',      to: `/app/${clientId}/errors`,       icon: <Bug       className="w-3.5 h-3.5" /> },
    { label: 'Service Map', to: `/app/${clientId}/service-map`,  icon: <GitBranch className="w-3.5 h-3.5" /> },
    { label: 'SLO',         to: `/app/${clientId}/slo`,          icon: <Activity  className="w-3.5 h-3.5" /> },
    { label: 'RUM',         to: `/app/${clientId}/rum`,          icon: <Zap       className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="border-b border-[var(--c-border)] bg-[var(--c-surface)] mb-6">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center gap-1 py-2 overflow-x-auto -webkit-overflow-scrolling-touch">
          {/* Breadcrumb — hidden on very small screens */}
          {appName && (
            <div className="hidden sm:flex items-center flex-shrink-0 mr-1">
              <Link to="/dashboard" className="text-sm text-[var(--c-text3)] hover:text-[var(--c-text)]">Apps</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--c-text3)]" />
              <span className="text-sm font-medium text-[var(--c-text)] truncate max-w-[120px]">{appName}</span>
              <span className="mx-2 text-[var(--c-border2)]">|</span>
            </div>
          )}
          <nav className="flex gap-0.5 flex-shrink-0">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === `/app-monitoring/${clientId}`}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-[var(--c-blue)] font-medium bg-[var(--c-blue-lt)]'
                    : 'text-[var(--c-text3)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface2)]'
                )}
              >
                {t.icon}
                <span className="hidden xs:inline sm:inline">{t.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
