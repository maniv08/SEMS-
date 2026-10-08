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
