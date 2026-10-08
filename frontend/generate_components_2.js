import fs from 'fs';
import path from 'path';

const components = {
  'ui/ProgressGauge.jsx': `
import React from 'react';

export function ProgressGauge({ percentage }) {
  // A simple semicircle progress gauge
  const r = 40;
  const c = Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percentage)) / 100) * c;
  
  let color = 'var(--brand)';
  if (percentage >= 80) color = 'var(--warning)';
  if (percentage >= 100) color = 'var(--critical)';

  return (
    <div className="relative flex items-center justify-center w-32 h-16 overflow-hidden">
      <svg className="w-32 h-32 transform -rotate-180" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="10" strokeDasharray={c + " " + c} />
        <circle 
          cx="50" cy="50" r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          strokeDasharray={c + " " + c} 
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 text-lg font-semibold tabular-nums text-primary">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}
`,

  'ui/Modal.jsx': `
import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-surface rounded-card shadow-card w-full max-w-md p-6 transform transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-primary">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
`,

  'ui/ConfirmDialog.jsx': `
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={isDestructive ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
`,

  'charts/ForecastChart.jsx': `
import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ForecastChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="timestamp" stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => new Date(v).getHours() + ':00'} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
        />
        <Area type="monotone" dataKey="upperBound" stroke="none" fill="var(--violet)" fillOpacity={0.15} />
        <Area type="monotone" dataKey="lowerBound" stroke="none" fill="var(--surface)" fillOpacity={1} />
        <Line type="monotone" dataKey="predictedKwh" stroke="var(--violet)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="actualKwh" stroke="var(--accent)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
`,

  'charts/Heatmap.jsx': `
import React from 'react';

export function Heatmap({ data }) {
  // Fallback if no real data (e.g. 7 rows x 24 cols)
  const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[auto_repeat(24,minmax(20px,1fr))] gap-1 min-w-[600px]">
        {/* Header */}
        <div className="text-xs text-muted"></div>
        {Array.from({length: 24}).map((_, i) => (
          <div key={i} className="text-[10px] text-muted text-center">{i}</div>
        ))}
        
        {/* Rows */}
        {rows.map((day, r) => (
          <React.Fragment key={day}>
            <div className="text-xs text-muted pr-2 text-right self-center">{day}</div>
            {Array.from({length: 24}).map((_, c) => {
              // Mock value for preview
              const v = Math.random();
              const opacity = 0.1 + (v * 0.9);
              return (
                <div 
                  key={c} 
                  className="w-full aspect-square rounded-[2px]" 
                  style={{ backgroundColor: \`rgba(16, 185, 129, \${opacity})\` }}
                  title={\`\${day} \${c}:00\`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
`,

  '../context/AuthContext.jsx': `
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Setup default header
      axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
      // Verify token
      axios.get('http://localhost:5000/api/v1/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`,

  'layout/ProtectedRoute.jsx': `
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
`,

  '../context/ToastContext.jsx': `
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={clsx(
            "px-4 py-3 rounded-md shadow-card flex items-center justify-between gap-3 min-w-[200px]",
            t.type === 'error' ? 'bg-critical text-white' : 'bg-surface text-primary border border-border'
          )}>
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <X className="h-4 w-4 opacity-70 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
`,
};

const basePath = path.join(process.cwd(), 'src', 'components');

for (const [relativePath, content] of Object.entries(components)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
  console.log('Created', relativePath);
}

// Interceptors config
const libPath = path.join(process.cwd(), 'src', 'lib');
fs.mkdirSync(libPath, { recursive: true });
fs.writeFileSync(path.join(libPath, 'axios.js'), `
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
`);
console.log('Created lib/axios.js');

console.log('Done generating components 2');
