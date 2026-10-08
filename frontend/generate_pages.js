import fs from 'fs';
import path from 'path';

const pages = {
  'Login.jsx': `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import api from '../lib/axios';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.token, res.data.data.user);
      showToast('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-semibold text-center">Welcome Back</CardTitle>
          <p className="text-sm text-muted text-center">Login to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input 
              label="Email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            {error && <div className="text-sm text-critical">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-muted mt-2">
              Don't have an account? <Link to="/register" className="text-accent hover:underline">Register</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`,

  'Register.jsx': `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import api from '../lib/axios';

export function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      login(res.data.data.token, res.data.data.user);
      showToast('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-semibold text-center">Create an Account</CardTitle>
          <p className="text-sm text-muted text-center">Join Smart Energy today</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input 
              label="Full Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <Input 
              label="Email" 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            <Input 
              label="Confirm Password" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              required 
            />
            {error && <div className="text-sm text-critical">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-center text-sm text-muted mt-2">
              Already have an account? <Link to="/login" className="text-accent hover:underline">Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`,

  'DesignPreview.jsx': `
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ProgressGauge } from '../components/ui/ProgressGauge';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { DataTable } from '../components/shared/DataTable';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export function DesignPreview() {
  const { showToast } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [period, setPeriod] = useState('Day');

  return (
    <div className="space-y-8 pb-12">
      <section>
        <h2 className="text-xl font-bold mb-4">Typography & Colors</h2>
        <div className="flex gap-4 mb-4">
          <div className="w-16 h-16 bg-background border border-border rounded-md"></div>
          <div className="w-16 h-16 bg-surface border border-border rounded-md"></div>
          <div className="w-16 h-16 bg-brand rounded-md"></div>
          <div className="w-16 h-16 bg-accent rounded-md"></div>
          <div className="w-16 h-16 bg-warning rounded-md"></div>
          <div className="w-16 h-16 bg-critical rounded-md"></div>
          <div className="w-16 h-16 bg-violet rounded-md"></div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Page Title H1</h1>
          <p className="text-sm">Body text with tabular nums: <span className="tabular-nums">1,234.56</span></p>
          <p className="text-xs text-muted">Muted caption text</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Buttons & Inputs</h2>
        <div className="flex gap-4 mb-4 items-center flex-wrap">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <Input label="Standard Input" placeholder="Placeholder..." />
          <Input label="Error Input" defaultValue="Wrong value" error="Invalid format" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">42.5 kWh</div>
              <div className="text-xs text-brand mt-1">+12% vs last week</div>
            </CardContent>
          </Card>
          
          <Card className="flex items-center justify-center p-6">
            <ProgressGauge percentage={47.3} />
          </Card>
          
          <Card className="flex flex-col justify-center items-center p-6 gap-4">
            <SegmentedControl 
              options={[{label: 'Day', value: 'Day'}, {label: 'Week', value: 'Week'}]} 
              value={period} 
              onChange={setPeriod} 
            />
            <Button onClick={() => showToast('Action successful!', 'success')}>Show Toast</Button>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">States & Modals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card><EmptyState title="No units found" description="Add your first unit to start monitoring." action={<Button>Add Unit</Button>} /></Card>
          <Card><ErrorState description="Failed to load data from server." onRetry={() => {}} /></Card>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setConfirmOpen(true)} variant="danger">Open Confirm</Button>
        </div>
      </section>
      
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
        <p className="text-sm text-muted mb-4">This is a standard modal for forms or info.</p>
        <Button onClick={() => setModalOpen(false)} className="w-full">Close</Button>
      </Modal>
      
      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={() => showToast('Deleted!', 'error')} 
        title="Delete Unit?" 
        message="Are you sure you want to delete this unit? This action cannot be undone." 
        isDestructive={true}
        confirmText="Delete"
      />
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

// Overwrite App.jsx
const appPath = path.join(process.cwd(), 'src', 'App.jsx');
fs.writeFileSync(appPath, `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DesignPreview } from './pages/DesignPreview';

function DashboardPlaceholder() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-4">Welcome to the Dashboard!</p></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPlaceholder />} />
                <Route path="/design-preview" element={<DesignPreview />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
`);
console.log('Updated App.jsx with Auth and Toast providers, and Routes');
