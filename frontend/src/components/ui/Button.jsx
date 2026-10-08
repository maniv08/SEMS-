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
}
