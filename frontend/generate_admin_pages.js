import fs from 'fs';
import path from 'path';

const pages = {
  'admin/AdminDashboard.jsx': `
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
      setAlerts(res2.data.data.alerts);
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
`,

  'admin/AdminUsers.jsx': `
import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  const fetchUsers = () => api.get('/users').then(res => setUsers(res.data.data));
  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(\`/users/\${id}\`, { isActive: !currentStatus });
      showToast('User status updated');
      fetchUsers();
    } catch (e) {
      showToast('Update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Users</h1>
      <Card>
        <DataTable 
          columns={[
            { header: 'Name', accessorKey: 'name' },
            { header: 'Email', accessorKey: 'email' },
            { header: 'Role', cell: row => <span className="capitalize">{row.role}</span> },
            { header: 'Status', cell: row => row.isActive ? <span className="text-brand font-medium">Active</span> : <span className="text-critical font-medium">Inactive</span> },
            { header: 'Joined', cell: row => new Date(row.createdAt).toLocaleDateString() },
            { header: 'Actions', cell: row => (
                row.role !== 'admin' && 
                <Button variant={row.isActive ? 'danger' : 'primary'} onClick={() => toggleStatus(row._id, row.isActive)}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              ) 
            }
          ]}
          data={users}
        />
      </Card>
    </div>
  );
}
`,

  'admin/AdminSettings.jsx': `
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
            {/* MVP: Slabs omitted for brevity but can be expanded */}
            <Button type="submit">Save Changes</Button>
          </form>
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

// Update App.jsx to include Admin Routes
const appPath = path.join(process.cwd(), 'src', 'App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');
const newAppContent = appContent.replace(
  'import { Alerts } from \'./pages/Alerts\';',
  \`import { Alerts } from './pages/Alerts';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';\`
).replace(
  '<Route path="/alerts" element={<Alerts />} />',
  \`<Route path="/alerts" element={<Alerts />} />
                
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>\`
);
fs.writeFileSync(appPath, newAppContent);
console.log('Updated App.jsx with Admin routes');

// Update Sidebar.jsx to show admin links conditionally
const sidebarPath = path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.jsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const newSidebarContent = sidebarContent.replace(
  'import { Home, BarChart2, Clock, AlertCircle, LogOut } from \'lucide-react\';',
  'import { Home, BarChart2, Clock, AlertCircle, LogOut, Settings, Users, Activity } from \'lucide-react\';\\nimport { useAuth } from \'../../../context/AuthContext\';'
).replace(
  'export function Sidebar() {',
  \`const adminNavItems = [
  { icon: Activity, label: 'Admin Panel', to: '/admin/dashboard' },
  { icon: Users, label: 'Users', to: '/admin/users' },
  { icon: Settings, label: 'Settings', to: '/admin/settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();\`
).replace(
  '        {navItems.map((item) => (',
  \`        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive ? "bg-brand/10 text-brand" : "text-muted hover:text-primary hover:bg-border/30"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <span className="px-3 text-xs font-semibold text-muted uppercase tracking-wider">Admin</span>
            {adminNavItems.map((item) => (\`
).replace(
  '            <item.icon className="h-5 w-5" />\\n            {item.label}\\n          </NavLink>\\n        ))}\\n      </nav>',
  \`            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
          </div>
        )}
      </nav>\`
).replace(
  '<button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-muted hover:text-primary hover:bg-border/30 transition-colors">',
  '<button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-muted hover:text-primary hover:bg-border/30 transition-colors">'
);

fs.writeFileSync(sidebarPath, newSidebarContent);
console.log('Updated Sidebar.jsx with conditionally rendered Admin links');
