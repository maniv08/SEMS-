import React from 'react';

export function Heatmap({ data }) {
  // Fallback if no real data (e.g. 7 rows x 24 cols)
  const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[auto_repeat(24,minmax(20px,1fr))] gap-1 min-w-[600px]">
        {/* Header */}
        <div className="text-xs text-muted"></div>
        {Array.from({length: 24}).map((_, i) => (
          <div key={i} className="text-[10px] text-muted text-center">{i}</div>
        ))}
        
        {/* Rows */}
        {rows.map((day, r) => (
          <React.Fragment key={day}>
            <div className="text-xs text-muted pr-2 text-right self-center">{day}</div>
            {Array.from({length: 24}).map((_, c) => {
              // Mock value for preview
              const v = Math.random();
              const opacity = 0.1 + (v * 0.9);
              return (
                <div 
                  key={c} 
                  className="w-full aspect-square rounded-[2px]" 
                  style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                  title={`${day} ${c}:00`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
