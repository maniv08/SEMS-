import fs from 'fs';
import path from 'path';

const pages = {
  'Predictions.jsx': `
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ForecastChart } from '../components/charts/ForecastChart';
import api from '../lib/axios';

export function Predictions() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/predictions/forecast').then(res => {
      setForecast(res.data.data.forecast);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Predictions</h1>
      <Card>
        <CardHeader><CardTitle>7-Day Forecast</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading forecast...</p> : <ForecastChart data={forecast} />}
        </CardContent>
      </Card>
    </div>
  );
}
`,
  'Recommendations.jsx': `
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../lib/axios';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recommendations').then(res => {
      setRecommendations(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recommendations</h1>
      <div className="space-y-4">
        {loading ? <p>Loading recommendations...</p> : recommendations.length === 0 ? <p>No recommendations available.</p> :
          recommendations.map((rec, i) => (
            <Card key={i} className="bg-brand/5 border-brand/20">
              <CardHeader><CardTitle className="text-brand">{rec.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-primary mb-2">{rec.description}</p>
                {rec.estimatedSavingsInr && <div className="text-xs font-semibold text-brand">Potential Savings: ₹{rec.estimatedSavingsInr}</div>}
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
`,
  'Reports.jsx': `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

export function Reports() {
  const { showToast } = useToast();

  const handleDownload = async (type) => {
    try {
      if (type === 'csv') {
        window.open(\`\${api.defaults.baseURL}/reports/csv\`, '_blank');
      } else {
        window.open(\`\${api.defaults.baseURL}/reports/pdf\`, '_blank');
      }
    } catch (e) {
      showToast('Download failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card>
        <CardHeader><CardTitle>Download Reports</CardTitle></CardHeader>
        <CardContent className="space-x-4">
          <Button onClick={() => handleDownload('csv')}>Download CSV</Button>
          <Button onClick={() => handleDownload('pdf')} variant="secondary">Download PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
}
`,
  'Profile.jsx': `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card>
        <CardHeader><CardTitle>User Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="text-sm text-muted">Name</label><p>{user?.name}</p></div>
          <div><label className="text-sm text-muted">Email</label><p>{user?.email}</p></div>
          <div><label className="text-sm text-muted">Role</label><p className="capitalize">{user?.role}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
`,
  'admin/AdminBuildings.jsx': `
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import api from '../../lib/axios';

export function AdminBuildings() {
  const [buildings, setBuildings] = useState([]);
  
  useEffect(() => {
    api.get('/buildings').then(res => setBuildings(res.data.data.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Buildings</h1>
      <Card>
        <CardHeader><CardTitle>All Buildings</CardTitle></CardHeader>
        <CardContent>
          <DataTable 
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Address', accessorKey: 'address' },
              { header: 'City', accessorKey: 'city' }
            ]}
            data={buildings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
`,
  'admin/AdminEnergyMonitoring.jsx': `
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import api from '../../lib/axios';

export function AdminEnergyMonitoring() {
  const [records, setRecords] = useState([]);
  
  useEffect(() => {
    api.get('/analytics/admin/overview').then(res => {
      setRecords(res.data.data.topConsumers || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Energy Monitoring</h1>
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
  );
}
`,
  'admin/AdminReports.jsx': `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';

export function AdminReports() {
  const downloadReport = () => {
    window.open(\`\${api.defaults.baseURL}/reports/admin\`, '_blank');
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
`
};

const basePath = path.join(process.cwd(), 'src', 'pages');

for (const [relativePath, content] of Object.entries(pages)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
  console.log('Created', relativePath);
}

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Insert imports if not present
const newImports = \`
import { Predictions } from './pages/Predictions';
import { Recommendations } from './pages/Recommendations';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { AdminBuildings } from './pages/admin/AdminBuildings';
import { AdminEnergyMonitoring } from './pages/admin/AdminEnergyMonitoring';
import { AdminReports } from './pages/admin/AdminReports';
\`;

appContent = appContent.replace("import { Landing } from './pages/Landing';", "import { Landing } from './pages/Landing';\\n" + newImports);

// Insert routes
const userRoutes = \`
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
\`;
appContent = appContent.replace('<Route path="/alerts" element={<Alerts />} />', '<Route path="/alerts" element={<Alerts />} />' + userRoutes);

const adminRoutes = \`
                  <Route path="/admin/buildings" element={<AdminBuildings />} />
                  <Route path="/admin/energy" element={<AdminEnergyMonitoring />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
\`;
appContent = appContent.replace('<Route path="/admin/settings" element={<AdminSettings />} />', '<Route path="/admin/settings" element={<AdminSettings />} />' + adminRoutes);

fs.writeFileSync(appPath, appContent);
console.log('Updated App.jsx with P2 routes');
