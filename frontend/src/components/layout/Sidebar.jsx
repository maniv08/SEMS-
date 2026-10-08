import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Home, BarChart2, Clock, AlertCircle, LogOut, Settings, Users, Activity, Lightbulb, FileText, User, Building, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: Home, label: 'Dashboard', to: '/dashboard' },
  { icon: BarChart2, label: 'Analytics', to: '/analytics' },
  { icon: Clock, label: 'History', to: '/history' },
  { icon: AlertCircle, label: 'Alerts', to: '/alerts' },
  { icon: Activity, label: 'Predictions', to: '/predictions' },
  { icon: Lightbulb, label: 'Recommendations', to: '/recommendations' },
  { icon: FileText, label: 'Reports', to: '/reports' },
  { icon: User, label: 'Profile', to: '/profile' },
];

const adminNavItems = [
  { icon: Activity, label: 'Admin Panel', to: '/admin/dashboard' },
  { icon: Users, label: 'Users', to: '/admin/users' },
  { icon: Zap, label: 'Units', to: '/admin/units' },
  { icon: Building, label: 'Buildings', to: '/admin/buildings' },
  { icon: Activity, label: 'Energy Monitor', to: '/admin/energy' },
  { icon: FileText, label: 'Reports', to: '/admin/reports' },
  { icon: Settings, label: 'Settings', to: '/admin/settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="w-[248px] hidden md:flex flex-col border-r border-border bg-surface">
      <div className="p-4 border-b border-border h-14 flex items-center font-bold text-primary">
        SEMS
      </div>
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive ? "bg-brand/10 text-brand" : "text-muted hover:text-primary hover:bg-border/30"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <span className="px-3 text-xs font-semibold text-muted uppercase tracking-wider">Admin</span>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-brand/10 text-brand" : "text-muted hover:text-primary hover:bg-border/30"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
      <div className="p-4 border-t border-border">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-muted hover:text-primary hover:bg-border/30 transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
