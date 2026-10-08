import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button aria-label="Toggle Menu" className="md:hidden text-muted hover:text-primary">
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
        <button aria-label="Toggle Theme" onClick={toggleTheme} className="text-muted hover:text-primary">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
