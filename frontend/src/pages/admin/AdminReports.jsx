import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';

export function AdminReports() {
  const downloadReport = () => {
    window.open(`${api.defaults.baseURL}/reports/admin`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Reports</h1>
      <Card>
        <CardHeader><CardTitle>System Reports</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={downloadReport}>Download System CSV</Button>
        </CardContent>
      </Card>
    </div>
  );
}
