import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressGauge } from '../components/ui/ProgressGauge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ConsumptionChart } from '../components/charts/ConsumptionChart';
import { ForecastChart } from '../components/charts/ForecastChart';
import { Heatmap } from '../components/charts/Heatmap';
import { DataTable } from '../components/shared/DataTable';
import { EmptyState } from '../components/shared/EmptyState';
import api from '../lib/axios';

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [consumption, setConsumption] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [units, setUnits] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [period, setPeriod] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to yesterday so the Day chart is always fully populated by default
    const yesterdayIst = new Date(new Date().getTime() + 19800000 - 86400000);
    return yesterdayIst.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumRes, consRes, unitsRes, alertsRes, recRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get(`/analytics/consumption?period=${period.toLowerCase()}&dateStr=${selectedDate}`),
        api.get('/units'),
        api.get('/alerts?status=open&limit=5'),
        api.get('/recommendations'),
      ]);
      setSummary(sumRes.data.data);
      // Consumption endpoint returns { series: [...], comparison: [...], total, unit }
      const consData = consRes.data.data;
      setConsumption(consData?.series || consData || []);
      const fetchedUnits = unitsRes.data.data.items || unitsRes.data.data || [];
      setUnits(fetchedUnits);
      setAlerts(alertsRes.data.data.items || alertsRes.data.data.records || []);
      // Recommendations returns { recommendations: [...] }
      const recData = recRes.data.data;
      setRecommendations(recData?.recommendations || recData || []);
      // Forecast requires a unitId — use first unit if available
      if (fetchedUnits.length > 0) {
        const foreRes = await api.get(`/predictions/forecast?unitId=${fetchedUnits[0]._id}`);
        setForecast(foreRes.data.data.forecast || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period, selectedDate]);

  if (loading && !summary) return <div className="p-8">Loading...</div>;
  if (units.length === 0) return <EmptyState title="No Units" description="Add your first unit to start monitoring." />;

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
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Today</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.todayKwh?.toFixed(2) || '0.00'} kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>This Month</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.monthKwh?.toFixed(2) || '0.00'} kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Estimated Bill</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">₹{summary?.estimatedBill?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Current Load</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.currentHourKwh?.toFixed(2) || '0.00'} kWh</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Consumption
              {peakWeekText && <span className="text-sm font-normal text-brand bg-brand/10 px-2 py-0.5 rounded-full">Peak: {peakWeekText}</span>}
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            <ConsumptionChart data={consumption} />
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader><CardTitle>Monthly Limit</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {units.length > 0 && <ProgressGauge percentage={(summary?.monthKwh / units[0]?.monthlyLimitKwh) * 100 || 0} />}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                {summary?.monthKwh?.toFixed(1) || '0.0'} / {units[0]?.monthlyLimitKwh} kWh
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Usage Heatmap</CardTitle></CardHeader>
          <CardContent><Heatmap /></CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader><CardTitle>7-Day Forecast</CardTitle></CardHeader>
          <CardContent><ForecastChart data={forecast} /></CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader><CardTitle>Recent Alerts</CardTitle></CardHeader>
          <CardContent>
            {alerts.length === 0 ? <p className="text-sm text-muted">No recent alerts.</p> : 
              <ul className="space-y-4">
                {alerts.map(a => (
                  <li key={a._id} className="text-sm border-b border-border pb-2">
                    <div className="flex justify-between"><span className="font-medium">{a.type}</span> <span className="text-muted text-xs">{new Date(a.createdAt).toLocaleDateString()}</span></div>
                    <p className="text-muted mt-1">{a.message}</p>
                  </li>
                ))}
              </ul>
            }
          </CardContent>
        </Card>
      </div>

      {recommendations.length > 0 && (
        <Card className="bg-brand/5 border-brand/20">
          <CardHeader><CardTitle className="text-brand">Insight: {recommendations[0].title}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-primary mb-2">{recommendations[0].description}</p>
            <div className="text-xs font-semibold text-brand">Potential Savings: ₹{recommendations[0].estimatedSavingRs}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Your Units</CardTitle></CardHeader>
        <CardContent>
          <DataTable 
            columns={[
              { header: 'Unit Name', accessorKey: 'name' },
              { header: 'Limit (kWh)', accessorKey: 'monthlyLimitKwh' },
              { header: 'Type', accessorKey: 'unitType' }
            ]} 
            data={units} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
