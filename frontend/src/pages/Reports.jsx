import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

export function Reports() {
  const { showToast } = useToast();

  const handleDownload = async (type) => {
    try {
      // type: 'history' or 'summary'
      const res = await api.get(`/reports/export?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast('Download failed. No data available.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card>
        <CardHeader><CardTitle>Download Reports</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-1">Raw History Export</h3>
              <p className="text-sm text-muted mb-3">All hourly energy readings with anomaly flags and timestamps (IST).</p>
              <Button onClick={() => handleDownload('history')}>Download CSV</Button>
            </div>
            <div className="flex-1 p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-1">Daily Summary Report</h3>
              <p className="text-sm text-muted mb-3">Daily totals grouped by date for the current month.</p>
              <Button onClick={() => handleDownload('summary')} variant="secondary">Download Summary CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
