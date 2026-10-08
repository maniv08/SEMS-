import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ForecastChart } from '../components/charts/ForecastChart';
import { EmptyState } from '../components/shared/EmptyState';
import api from '../lib/axios';

export function Predictions() {
  const [forecast, setForecast] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/units').then(res => {
      const u = res.data.data.items || res.data.data || [];
      setUnits(u);
      if (u.length > 0) setSelectedUnitId(u[0]._id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUnitId) return;
    setLoading(true);
    setError(null);
    api.get(`/predictions/forecast?unitId=${selectedUnitId}`)
      .then(res => {
        setForecast(res.data.data.forecast);
        setAccuracy(res.data.data.accuracy);
      })
      .catch(() => setError('Failed to load forecast'))
      .finally(() => setLoading(false));
  }, [selectedUnitId]);

  if (!selectedUnitId && !loading) return <EmptyState title="No Units" description="Add a unit to see energy forecasts." />;

  // Aggregate hourly forecast → daily totals for the chart
  const dailyForecast = [];
  if (forecast.length > 0) {
    const map = {};
    for (const h of forecast) {
      const day = new Date(h.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' });
      if (!map[day]) map[day] = 0;
      map[day] += h.predictedKwh;
    }
    for (const [label, kwh] of Object.entries(map)) {
      dailyForecast.push({ label, predictedKwh: Number(kwh.toFixed(2)) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Predictions</h1>
        {units.length > 1 && (
          <select
            className="border border-border rounded px-3 py-1.5 text-sm bg-surface"
            value={selectedUnitId || ''}
            onChange={e => setSelectedUnitId(e.target.value)}
          >
            {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle>7-Day Forecast (Daily totals)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted">Loading forecast...</p>
            : error ? <p className="text-critical">{error}</p>
            : <ForecastChart data={dailyForecast} />}
        </CardContent>
      </Card>
      {accuracy && (
        <Card>
          <CardHeader><CardTitle>Model Accuracy (7-day holdout)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted">MAE</p><p className="text-xl font-semibold tabular-nums">{accuracy.mae} kWh</p></div>
            <div><p className="text-sm text-muted">MAPE</p><p className="text-xl font-semibold tabular-nums">{accuracy.mape}%</p></div>
            <div className="col-span-2 text-xs text-muted">{accuracy.note}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
