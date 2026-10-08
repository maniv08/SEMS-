import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, KeyRound, CheckCircle2, Lock, Settings } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/axios';

export function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast('Password updated successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile Settings</h1>
        <p className="text-muted text-sm">Manage your account details and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 space-y-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'general' 
                ? 'bg-brand text-white shadow-md' 
                : 'bg-surface hover:bg-border/50 text-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            General Profile
          </button>
          
          <button
            onClick={() => setActiveTab('authentication')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'authentication' 
                ? 'bg-brand text-white shadow-md' 
                : 'bg-surface hover:bg-border/50 text-foreground'
            }`}
          >
            <Shield className="w-5 h-5" />
            Security & Authentication
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl">
              <Card className="border-border/50 bg-surface/50 backdrop-blur-sm overflow-hidden group">
                <div className="h-32 bg-gradient-to-r from-brand to-emerald-400 opacity-20 transition-opacity group-hover:opacity-30"></div>
                <CardContent className="pt-0 relative -mt-16 flex flex-col px-8 pb-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand to-emerald-500 p-1.5 shadow-xl mb-6 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-4xl font-bold text-brand shadow-inner">
                      {getInitials(user?.name)}
                    </div>
                  </div>
                  
                  <div className="space-y-6 w-full">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight">{user?.name}</h2>
                      <div className="flex items-center gap-2 mt-2 text-muted">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/50">
                      <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/50 border border-border/30 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted mb-1">
                          <User className="w-4 h-4 text-brand" />
                          Account Role
                        </div>
                        <span className="font-medium capitalize text-lg text-foreground">{user?.role}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/50 border border-border/30 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Status
                        </div>
                        <div className="flex items-center mt-0.5">
                          <span className="font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-sm">Active Member</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'authentication' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl">
              <Card className="border-border/50 bg-surface/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 pb-5">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <KeyRound className="w-6 h-6 text-brand" />
                    Update Password
                  </CardTitle>
                  <p className="text-sm text-muted mt-2">Ensure your account is using a long, random password to stay secure.</p>
                </CardHeader>
                <CardContent className="pt-8">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-muted" />
                        </div>
                        <input
                          type="password"
                          required
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                          placeholder="Enter current password"
                          value={passwordData.currentPassword}
                          onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-muted" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={8}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                          placeholder="8+ chars, 1 uppercase, 1 digit"
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CheckCircle2 className="h-5 w-5 text-muted" />
                        </div>
                        <input
                          type="password"
                          required
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 shadow-md">
                        {loading ? 'Updating Password...' : 'Save Password'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
