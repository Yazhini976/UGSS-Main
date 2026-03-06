import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  HardHat,
  ArrowUpFromDot,
  Droplets,
  Factory,
  Wrench,
  Wallet,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'citizen', label: 'Citizen', icon: Users, path: '/citizen' },
  { id: 'field-team', label: 'Field Team', icon: HardHat, path: '/field-team' },
  { id: 'lifting-stations', label: 'Lifting Stations', icon: ArrowUpFromDot, path: '/lifting-stations' },
  { id: 'pumping-stations', label: 'Pumping Stations', icon: Droplets, path: '/pumping-stations' },
  { id: 'stp', label: 'STP', icon: Factory, path: '/stp' },
  { id: 'assets', label: 'Assets & Energy', icon: Wrench, path: '/assets' },
  { id: 'finance', label: 'Finance & Planning', icon: Wallet, path: '/finance' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
  { id: 'chatbot', label: 'AI Chatbot', icon: MessageSquare, path: '/chatbot' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent">
              <ShieldCheck className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">Integrated UGSS & Compliance Management System</h1>

            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
                  {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with GitHub and collapse toggle */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {!collapsed && (
          <a
            href="https://github.com/Yazhini976/UGSSMAIN"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="truncate">View on GitHub</span>
          </a>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
