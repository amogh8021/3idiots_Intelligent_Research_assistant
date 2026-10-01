import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Search,
  History,
  Settings,
  BookOpen,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', to: '/documents', icon: FileText },
    { name: 'Research', to: '/research', icon: Search },
    { name: 'History', to: '/history', icon: History },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'RD';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 h-screen bg-stone-50 border-r border-stone-200/80 flex flex-col justify-between select-none shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="h-16 px-5 border-b border-stone-200/70 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center font-bold shadow-sm">
            <BookOpen className="w-4 h-4 text-stone-100" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-stone-900 flex items-center gap-1.5">
              ResearchDesk
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-600 font-medium">
                v2.0
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono tracking-tight">Academic Workspace</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-stone-400 uppercase font-mono">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-stone-200/75 text-stone-900 font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-stone-500" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Sign Out */}
      <div className="p-3 border-t border-stone-200/70 space-y-2 bg-stone-50/50">
        <div className="flex items-center gap-2 px-3 py-1 text-xs text-stone-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-stone-500">Live Context Connected</span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-white border border-stone-200/60 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center text-xs font-semibold font-mono shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-stone-900 truncate">
                {user?.name || 'Dr. Eleanor Vance'}
              </div>
              <div className="text-[10px] text-stone-500 truncate font-mono">
                {user?.email || 'researcher@researchdesk.ai'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
