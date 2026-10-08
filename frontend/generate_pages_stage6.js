import fs from 'fs';
import path from 'path';

const pages = {
  'Dashboard.jsx': `
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
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumRes, consRes, unitsRes, alertsRes, recRes, foreRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get(\`/analytics/consumption?period=\${period.toLowerCase()}\`),
        api.get('/units'),
        api.get('/alerts?status=open&limit=5'),
        api.get('/recommendations'),
        api.get('/predictions/forecast')
      ]);
      setSummary(sumRes.data.data);
      setConsumption(consRes.data.data);
      setUnits(unitsRes.data.data);
      setAlerts(alertsRes.data.data.alerts);
      setRecommendations(recRes.data.data);
      setForecast(foreRes.data.data.forecast);
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
  }, [period]);

  if (loading && !summary) return <div className="p-8">Loading...</div>;
  if (units.length === 0) return <EmptyState title="No Units" description="Add your first unit to start monitoring." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Today</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.todayKwh.toFixed(2)} kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>This Month</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.monthKwh.toFixed(2)} kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Estimated Bill</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">₹{summary?.monthCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Current Load</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{summary?.currentLoadKwh?.toFixed(2) || '0.00'} kWh</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Consumption</CardTitle>
            <SegmentedControl options={[{label:'Day', value:'Day'},{label:'Week', value:'Week'},{label:'Month', value:'Month'}]} value={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent>
            <ConsumptionChart data={consumption.map(c => ({ label: c._id, kwh: c.kwh }))} />
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader><CardTitle>Monthly Limit</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {units.length > 0 && <ProgressGauge percentage={(summary?.monthKwh / units[0]?.monthlyLimitKwh) * 100 || 0} />}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                {summary?.monthKwh.toFixed(1)} / {units[0]?.monthlyLimitKwh} kWh
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
            <div className="text-xs font-semibold text-brand">Potential Savings: ₹{recommendations[0].estimatedSavingsInr}</div>
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
`,
  'Analytics.jsx': `
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
  
  useEffect(() => {
    api.get(\`/analytics/consumption?period=\${period.toLowerCase()}\`).then(res => setConsumption(res.data.data));
    api.get('/analytics/summary').then(res => setSummary(res.data.data));
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <SegmentedControl options={[{label:'Day', value:'Day'},{label:'Week', value:'Week'},{label:'Month', value:'Month'}]} value={period} onChange={setPeriod} />
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Total</div><div className="text-2xl font-semibold">{summary?.monthKwh.toFixed(1)} kWh</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Daily Avg</div><div className="text-2xl font-semibold">{(summary?.monthKwh / 30).toFixed(1)} kWh</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Cost</div><div className="text-2xl font-semibold">₹{summary?.monthCost.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Est. CO2</div><div className="text-2xl font-semibold">{(summary?.monthKwh * 0.82).toFixed(1)} kg</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Consumption Trend</CardTitle></CardHeader>
        <CardContent>
          <ConsumptionChart data={consumption.map(c => ({ label: c._id, kwh: c.kwh }))} />
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
`,
  'History.jsx': `
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { DataTable } from '../components/shared/DataTable';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';

export function History() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get(\`/energy/history?page=\${page}&limit=20\${anomalyOnly ? '&anomaly=true' : ''}\`);
      setHistory(res.data.data.records);
      setTotalPages(res.data.data.pagination.pages);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, anomalyOnly]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">History</h1>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={anomalyOnly} onChange={e => {setAnomalyOnly(e.target.checked); setPage(1);}} />
            Anomalies Only
          </label>
          <Button onClick={() => window.open(\`\${api.defaults.baseURL}/energy/export\`, '_blank')}>Export CSV</Button>
        </div>
      </div>
      
      <Card>
        <DataTable 
          columns={[
            { header: 'Time', cell: row => new Date(row.timestamp).toLocaleString() },
            { header: 'kWh', cell: row => <span className="tabular-nums font-medium">{row.kwh.toFixed(2)}</span> },
            { header: 'Status', cell: row => row.isAnomaly ? <span className="px-2 py-1 bg-critical/10 text-critical text-xs rounded-full">Anomaly</span> : 'Normal' }
          ]}
          data={history}
        />
        <div className="flex justify-between items-center p-4 border-t border-border">
          <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="secondary">Previous</Button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} variant="secondary">Next</Button>
        </div>
      </Card>
    </div>
  );
}
`,
  'Alerts.jsx': `
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/shared/DataTable';
import { Button } from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

export function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const { showToast } = useToast();

  const fetchAlerts = async () => {
    try {
      const res = await api.get(\`/alerts?status=\${statusFilter}\`);
      setAlerts(res.data.data.alerts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const markRead = async (id) => {
    try {
      await api.patch(\`/alerts/\${id}/read\`);
      showToast('Alert marked as read');
      fetchAlerts();
    } catch (e) {
      showToast('Failed to mark alert as read', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <SegmentedControl options={[{label:'Open', value:'open'},{label:'Read', value:'read'}]} value={statusFilter} onChange={setStatusFilter} />
      </div>
      
      <Card>
        <DataTable 
          columns={[
            { header: 'Time', cell: row => new Date(row.createdAt).toLocaleString() },
            { header: 'Type', cell: row => <span className="font-medium capitalize">{row.type.replace('_', ' ')}</span> },
            { header: 'Message', accessorKey: 'message' },
            { header: 'Actions', cell: row => row.status === 'open' ? <Button variant="ghost" onClick={() => markRead(row._id)}>Mark Read</Button> : 'Read' }
          ]}
          data={alerts}
        />
      </Card>
    </div>
  );
}
`
};

const basePath = path.join(process.cwd(), 'src', 'pages');

for (const [relativePath, content] of Object.entries(pages)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
  console.log('Created', relativePath);
}

// Update App.jsx to include these routes
const appPath = path.join(process.cwd(), 'src', 'App.jsx');
fs.writeFileSync(appPath, `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DesignPreview } from './pages/DesignPreview';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { History } from './pages/History';
import { Alerts } from './pages/Alerts';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<History />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/design-preview" element={<DesignPreview />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
`);
console.log('Updated App.jsx with Stage 6 routes');
