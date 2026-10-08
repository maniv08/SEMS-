import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';

export function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [limit, setLimit] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/settings').then(res => {
      setSettings(res.data.data);
      setLimit(res.data.data.defaultMonthlyLimitKwh);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', { ...settings, defaultMonthlyLimitKwh: Number(limit) });
      showToast('Settings saved successfully');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">System Settings</h1>
      
      <Card>
        <CardHeader><CardTitle>Global Defaults</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input 
              label="Default Monthly Limit (kWh)" 
              type="number" 
              value={limit} 
              onChange={e => setLimit(e.target.value)} 
              required 
            />
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
