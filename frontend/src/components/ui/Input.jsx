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
