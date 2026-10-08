import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Activity, BarChart2, Shield, Zap } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-brand font-bold text-xl">
          <Zap className="h-6 w-6" />
          <span>SmartEnergy</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary mb-6">
          Take control of your <span className="text-brand">energy usage</span>
        </h1>
        <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl">
          Monitor your consumption, predict your bills, and uncover saving opportunities with intelligent real-time analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register"><Button size="lg" className="w-full sm:w-auto">Start Monitoring Free</Button></Link>
          <Link to="/design-preview"><Button size="lg" variant="secondary" className="w-full sm:w-auto">View UI Components</Button></Link>
        </div>
      </main>

      {/* Features */}
      <section className="bg-border/20 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">Intelligent insights out of the box</h2>
            <p className="text-muted">Everything you need to optimize your building's footprint.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-surface rounded-xl border border-border">
              <div className="h-12 w-12 bg-brand/10 text-brand rounded-lg flex items-center justify-center mb-6">
                <BarChart2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-muted">Track hourly consumption across all your units with rich heatmaps and trend graphs.</p>
            </div>
            
            <div className="p-6 bg-surface rounded-xl border border-border">
              <div className="h-12 w-12 bg-violet-500/10 text-violet-500 rounded-lg flex items-center justify-center mb-6">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Predictive AI</h3>
              <p className="text-muted">Stay ahead of your bill with our 7-day rolling forecasts and automated savings recommendations.</p>
            </div>
            
            <div className="p-6 bg-surface rounded-xl border border-border">
              <div className="h-12 w-12 bg-critical/10 text-critical rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Anomaly Detection</h3>
              <p className="text-muted">Get instant alerts when usage spikes unusually or limits are approached.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-surface border-t border-border mt-auto pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">&copy; {new Date().getFullYear()} SmartEnergy Management System.</p>
          <div className="flex gap-6 text-sm text-muted">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <a href="mailto:support@sems.demo" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-md border-t border-border z-40">
        <Link to="/register" className="block w-full">
          <Button className="w-full shadow-lg shadow-brand/20">Start Monitoring Free</Button>
        </Link>
      </div>
    </div>
  );
}
