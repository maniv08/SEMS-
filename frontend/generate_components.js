import fs from 'fs';
import path from 'path';

const components = {
  'ui/Button.jsx': `
import React from 'react';
import clsx from 'clsx';

export function Button({ variant = 'primary', className, children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand text-white hover:bg-emerald-600",
    secondary: "bg-surface text-primary border border-border hover:bg-gray-50 dark:hover:bg-gray-800",
    danger: "bg-critical text-white hover:bg-red-600",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted hover:text-primary",
  };
  
  return (
    <button className={clsx(base, variants[variant], 'h-10 px-4 py-2', className)} {...props}>
      {children}
    </button>
  );
}`,

  'ui/Input.jsx': `
import React from 'react';
import clsx from 'clsx';

export const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-primary">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-critical focus:ring-critical",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-critical">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
`,

  'ui/Card.jsx': `
import React from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx("rounded-card border border-border bg-surface shadow-card text-primary", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={clsx("flex flex-col space-y-1.5 p-6", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
  return <h3 className={clsx("text-sm font-medium text-muted", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }) {
  return <div className={clsx("p-6 pt-0", className)} {...props}>{children}</div>;
}
`,

  'ui/SegmentedControl.jsx': `
import React from 'react';
import clsx from 'clsx';

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-border/50 p-1 rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-colors",
            value === opt.value 
              ? "bg-surface text-primary shadow-sm" 
              : "text-muted hover:text-primary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
`,

  'shared/EmptyState.jsx': `
import React from 'react';
import { InboxIcon } from 'lucide-react';

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-border/50 flex items-center justify-center mb-4">
        <InboxIcon className="h-6 w-6 text-muted" />
      </div>
      <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
`,

  'shared/ErrorState.jsx': `
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-critical/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-critical" />
      </div>
      <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
`,

  'shared/DataTable.jsx': `
import React from 'react';

export function DataTable({ columns, data, className }) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-border/30 text-muted border-b border-border">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="h-10 px-4 align-middle font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border transition-colors hover:bg-border/20">
              {columns.map((col, j) => (
                <td key={j} className="p-4 align-middle">{col.cell ? col.cell(row) : row[col.accessorKey]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`,

  'layout/Layout.jsx': `
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
`,

  'layout/Header.jsx': `
import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted hover:text-primary">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-primary">Smart Energy</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          Simulated live
        </div>
        <button onClick={toggleTheme} className="text-muted hover:text-primary">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
`,

  'layout/Sidebar.jsx': `
import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Home, BarChart2, Clock, AlertCircle, LogOut } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Dashboard', to: '/dashboard' },
  { icon: BarChart2, label: 'Analytics', to: '/analytics' },
  { icon: Clock, label: 'History', to: '/history' },
  { icon: AlertCircle, label: 'Alerts', to: '/alerts' },
];

export function Sidebar() {
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
      </nav>
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-muted hover:text-primary hover:bg-border/30 transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
`,

  'charts/ConsumptionChart.jsx': `
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ConsumptionChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--brand)' }}
        />
        <Area type="monotone" dataKey="kwh" stroke="var(--brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorKwh)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
`,
};

const basePath = path.join(process.cwd(), 'src', 'components');

for (const [relativePath, content] of Object.entries(components)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
  console.log('Created', relativePath);
}

// Generate hooks
const hooksPath = path.join(process.cwd(), 'src', 'hooks');
fs.mkdirSync(hooksPath, { recursive: true });
fs.writeFileSync(path.join(hooksPath, 'useTheme.js'), `
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
`);
console.log('Created hooks/useTheme.js');

// Update App.jsx and main.jsx
const appPath = path.join(process.cwd(), 'src', 'App.jsx');
fs.writeFileSync(appPath, `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

function DashboardPlaceholder() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Dashboard</h1></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/design-preview" element={<DashboardPlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
`);

const mainPath = path.join(process.cwd(), 'src', 'main.jsx');
fs.writeFileSync(mainPath, `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`);

console.log('Done generating boilerplate');
