import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { DataTable } from '../components/shared/DataTable';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/shared/EmptyState';
import api from '../lib/axios';

export function History() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [unitId, setUnitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Step 1: fetch the user's first unit
  useEffect(() => {
    api.get('/units').then(res => {
      const units = res.data.data.items || res.data.data || [];
      if (units && units.length > 0) {
        setUnitId(units[0]._id);
      } else {
        setLoading(false);
      }
    }).catch(e => {
      setError('Failed to load units');
      setLoading(false);
    });
  }, []);

  // Step 2: once we have a unitId, fetch history
  const fetchHistory = async () => {
    if (!unitId) return;
    setLoading(true);
    try {
      const res = await api.get(`/energy/history?unitId=${unitId}&page=${page}&limit=20${anomalyOnly ? '&anomalyOnly=true' : ''}`);
      setHistory(res.data.data.items || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } catch (e) {
      setError('Failed to load history');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [unitId, page, anomalyOnly]);

  const handleExport = () => {
    if (!unitId) return;
    const token = localStorage.getItem('token');
    const base = api.defaults.baseURL;
    // Open in new tab — auth header can't be set on window.open, so we include token as query param
    // The backend export endpoint uses authenticate middleware which reads from header,
    // so we trigger a fetch-based download instead
    api.get(`/energy/export?unitId=${unitId}${anomalyOnly ? '&anomalyOnly=true' : ''}`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `energy_history_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  if (!unitId && !loading) return <EmptyState title="No Units" description="Add a unit to your account to see history." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">History</h1>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={anomalyOnly} onChange={e => { setAnomalyOnly(e.target.checked); setPage(1); }} />
            Anomalies Only
          </label>
          <Button onClick={handleExport} disabled={!unitId}>Export CSV</Button>
        </div>
      </div>
      
      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted">Loading history...</div>
        ) : error ? (
          <div className="p-8 text-center text-critical">{error}</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted">No records found.</div>
        ) : (
          <DataTable 
            columns={[
              { header: 'Time', cell: row => new Date(row.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
              { header: 'kWh', cell: row => <span className="tabular-nums font-medium">{row.kwh.toFixed(2)}</span> },
              { header: 'Status', cell: row => row.isAnomaly ? <span className="px-2 py-1 bg-critical/10 text-critical text-xs rounded-full">Anomaly</span> : <span className="text-muted text-xs">Normal</span> }
            ]}
            data={history}
          />
        )}
        <div className="flex justify-between items-center p-4 border-t border-border">
          <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="secondary">Previous</Button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} variant="secondary">Next</Button>
        </div>
      </Card>
    </div>
  );
}
