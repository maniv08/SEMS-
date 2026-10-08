import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import api from '../../lib/axios';

export function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/admin/overview'),
      api.get('/alerts?status=open&limit=10')
    ]).then(([res1, res2]) => {
      setOverview(res1.data.data);
      setAlerts(res2.data.data.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Total Units</div><div className="text-2xl font-semibold">{overview?.totalUnits || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">Active Users</div><div className="text-2xl font-semibold">{overview?.activeUsers || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">System Month kWh</div><div className="text-2xl font-semibold">{overview?.totalMonthKwh?.toFixed(1) || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted">System Month ₹</div><div className="text-2xl font-semibold">₹{overview?.totalMonthCost?.toFixed(2) || 0}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top 5 Consumers</CardTitle></CardHeader>
          <CardContent>
            <DataTable 
              columns={[
                { header: 'Unit', accessorKey: 'name' },
                { header: 'Owner', accessorKey: 'ownerEmail' },
                { header: 'kWh', cell: row => row.kwh.toFixed(1) }
              ]}
              data={overview?.topConsumers || []}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>System Alerts</CardTitle></CardHeader>
          <CardContent>
            {alerts.length === 0 ? <p className="text-sm text-muted">No open alerts.</p> : 
              <ul className="space-y-4">
                {alerts.map(a => (
                  <li key={a._id} className="text-sm border-b border-border pb-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium capitalize">{a.type.replace('_', ' ')}</span>
                      <p className="text-muted mt-1">{a.message}</p>
                    </div>
                    <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
