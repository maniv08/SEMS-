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
      navigate('/welcome');
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
