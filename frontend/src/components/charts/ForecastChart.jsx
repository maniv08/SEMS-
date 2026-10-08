import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ForecastChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted text-sm">No forecast data available</div>;
  }

  // Support both daily data (has `label`) and hourly data (has `timestamp`)
  const xKey = data[0]?.label !== undefined ? 'label' : 'timestamp';
  const xFormatter = xKey === 'timestamp'
    ? (v) => new Date(v).getHours() + ':00'
    : (v) => v;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} stroke="var(--text-muted)" fontSize={12} tickFormatter={xFormatter} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis width={65} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} unit=" kWh" />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
          formatter={(v) => [`${v} kWh`]}
        />
        <Area type="monotone" dataKey="upperBound" stroke="none" fill="var(--violet)" fillOpacity={0.15} />
        <Area type="monotone" dataKey="lowerBound" stroke="none" fill="var(--surface)" fillOpacity={1} />
        <Line type="monotone" dataKey="predictedKwh" stroke="var(--violet)" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Predicted" />
        <Line type="monotone" dataKey="actualKwh" stroke="var(--accent)" strokeWidth={2} dot={false} name="Actual" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
