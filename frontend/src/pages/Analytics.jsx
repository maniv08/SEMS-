import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ConsumptionChart } from '../components/charts/ConsumptionChart';
import { Heatmap } from '../components/charts/Heatmap';
import api from '../lib/axios';

export function Analytics() {
  const [consumption, setConsumption] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('Week');
  const [selectedDate, setSelectedDate] = useState(() => {
    const nowIst = new Date(new Date().getTime() + 19800000);
    return nowIst.toISOString().split('T')[0];
  });
  
  useEffect(() => {
    api.get(`/analytics/consumption?period=${period.toLowerCase()}&dateStr=${selectedDate}`).then(res => {
      // Backend returns { series: [...], comparison: [...], total, unit }
      const data = res.data.data;
      setConsumption(data?.series || data || []);
    });
    api.get('/analytics/summary').then(res => setSummary(res.data.data));
  }, [period, selectedDate]);

  // Generate dropdown options based on period
  const [year, monthStr, dayStr] = selectedDate.split('-');
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });

  let dropdownOptions = [];
  let dropdownValue = selectedDate;

  if (period === 'Day') {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dropdownOptions.push({ label: `${monthName} ${i}, ${year}`, value: `${year}-${monthStr}-${String(i).padStart(2, '0')}` });
    }
  } else if (period === 'Week') {
    dropdownOptions = [
      { label: `${monthName} Week 1`, value: `${year}-${monthStr}-01` },
      { label: `${monthName} Week 2`, value: `${year}-${monthStr}-08` },
      { label: `${monthName} Week 3`, value: `${year}-${monthStr}-15` },
      { label: `${monthName} Week 4`, value: `${year}-${monthStr}-22` },
    ];
    if (day >= 22) dropdownValue = `${year}-${monthStr}-22`;
    else if (day >= 15) dropdownValue = `${year}-${monthStr}-15`;
    else if (day >= 8) dropdownValue = `${year}-${monthStr}-08`;
    else dropdownValue = `${year}-${monthStr}-01`;
  } else if (period === 'Month') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, i) => {
      dropdownOptions.push({ label: `${m} ${year}`, value: `${year}-${String(i + 1).padStart(2, '0')}-01` });
    });
    dropdownValue = `${year}-${monthStr}-01`;
  }

  let peakWeekText = null;
  if (period === 'Month' && consumption.length > 0) {
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    consumption.forEach(c => {
      const dayNum = parseInt(c.timestamp.split('-')[2], 10);
      if (dayNum >= 22) w4 += c.kwh;
      else if (dayNum >= 15) w3 += c.kwh;
      else if (dayNum >= 8) w2 += c.kwh;
      else w1 += c.kwh;
    });
    const max = Math.max(w1, w2, w3, w4);
    if (max > 0) {
      if (max === w1) peakWeekText = 'Week 1';
      else if (max === w2) peakWeekText = 'Week 2';
      else if (max === w3) peakWeekText = 'Week 3';
      else if (max === w4) peakWeekText = 'Week 4';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-4">
          <select 
            className="bg-surface border border-border text-sm rounded-md px-3 py-1.5 outline-none focus:border-brand"
            value={dropdownValue}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dropdownOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <SegmentedControl options={[{label:'Day', value:'Day'},{label:'Week', value:'Week'},{label:'Month', value:'Month'}]} value={period} onChange={setPeriod} />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Total</div><div className="text-2xl font-semibold">{summary?.monthKwh?.toFixed(1) || '0.0'} kWh</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Daily Avg</div><div className="text-2xl font-semibold">{((summary?.monthKwh || 0) / 30).toFixed(1)} kWh</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Cost</div><div className="text-2xl font-semibold">₹{summary?.estimatedBill?.toFixed(2) || '0.00'}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Est. CO2</div><div className="text-2xl font-semibold">{((summary?.monthKwh || 0) * 0.82).toFixed(1)} kg</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Consumption Trend
            {peakWeekText && <span className="text-sm font-normal text-brand bg-brand/10 px-2 py-0.5 rounded-full">Peak: {peakWeekText}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsumptionChart data={consumption.map(c => ({ label: c._id || c.label, kwh: c.kwh }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Usage Heatmap</CardTitle></CardHeader>
        <CardContent>
          <Heatmap />
        </CardContent>
      </Card>
    </div>
  );
}
