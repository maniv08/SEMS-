import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, ReferenceLine } from 'recharts';

export function ConsumptionChart({ data }) {
  if (!data || data.length === 0) return null;

  // Find the most consumed energy point
  const maxPoint = data.reduce((max, point) => (point.kwh > max.kwh ? point : max), data[0]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis width={65} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        
        {/* Draw a ReferenceLine at the max point X position */}
        {maxPoint && (
          <ReferenceLine 
            x={maxPoint.label} 
            stroke="var(--critical)" 
            strokeDasharray="3 3" 
            label={{ value: 'Peak', position: 'insideTopLeft', fill: 'var(--critical)', fontSize: 12 }} 
          />
        )}

        <Area type="monotone" dataKey="kwh" stroke="var(--brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorKwh)" />
        
        {/* Highlight the most consumed period with a dot */}
        {maxPoint && (
          <ReferenceDot 
            x={maxPoint.label} 
            y={maxPoint.kwh} 
            r={5} 
            fill="var(--critical)" 
            stroke="var(--surface)" 
            strokeWidth={2}
          />
        )}
        
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--brand)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
