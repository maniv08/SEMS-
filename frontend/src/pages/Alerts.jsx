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
      const res = await api.get(`/alerts?status=${statusFilter}`);
      setAlerts(res.data.data.items || res.data.data.records || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const markRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
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
