import React from 'react';

export function ProgressGauge({ percentage }) {
  const percentageBounded = Math.min(100, Math.max(0, percentage));
  
  let color = 'var(--brand)';
  if (percentage >= 80) color = 'var(--warning)';
  if (percentage >= 100) color = 'var(--critical)';

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[160px]">
      <svg className="w-full overflow-visible" viewBox="0 0 100 60">
        {/* Background Track */}
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke="var(--border)" 
          strokeWidth="10" 
          strokeLinecap="round" 
        />
        {/* Foreground Track */}
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeDasharray="100" 
          strokeDashoffset={100 - percentageBounded} 
          pathLength="100"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 text-2xl font-bold tabular-nums text-primary">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}
