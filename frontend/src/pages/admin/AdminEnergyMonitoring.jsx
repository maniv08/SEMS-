import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import api from '../../lib/axios';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AdminEnergyMonitoring() {
  const [records, setRecords] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Import State
  const [importUnitId, setImportUnitId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    // Fetch Top Consumers
    api.get('/analytics/admin/overview').then(res => {
      setRecords(res.data.data.topConsumers || []);
    });
    
    // Fetch all units for the import dropdown
    api.get('/units?limit=1000').then(res => {
      setUnits(res.data.data.items || []);
    });
  }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importUnitId || !importFile) return;
    
    setImportLoading(true);
    setImportResult(null);
    setImportError('');
    
    const formData = new FormData();
    formData.append('unitId', importUnitId);
    formData.append('file', importFile);
    
    try {
      const res = await api.post('/admin/energy/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data.data);
      setImportFile(null);
    } catch (err) {
      setImportError(err.response?.data?.error?.message || err.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Energy Monitoring</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Data Import</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Unit</label>
                <select
                  required
                  value={importUnitId}
                  onChange={e => setImportUnitId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a unit</option>
                  {units.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data File (CSV, JSON, XLSX)</label>
                <input
                  required
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={e => setImportFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={importLoading || !importUnitId || !importFile}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importLoading ? 'Importing...' : 'Upload Data'}
              </button>

              {importError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  Successfully inserted {importResult.inserted} records. Skipped {importResult.skipped}.
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Consumers</CardTitle></CardHeader>
          <CardContent>
            <DataTable 
              columns={[
                { header: 'Unit Name', accessorKey: 'name' },
                { header: 'Owner Email', accessorKey: 'ownerEmail' },
                { header: 'Consumption (kWh)', cell: row => row.kwh.toFixed(2) }
              ]}
              data={records}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
