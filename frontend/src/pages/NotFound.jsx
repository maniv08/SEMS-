import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md">
        {/* Big 404 number */}
        <div className="text-8xl font-bold text-brand/30 select-none mb-2">404</div>

        <h1 className="text-2xl font-semibold text-primary mb-2">Page not found</h1>
        <p className="text-muted text-sm mb-8">
          This page doesn't exist or has been moved. Check the URL or use one of the links below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 border border-border text-primary rounded-lg text-sm font-medium hover:bg-border/30 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 border border-border text-primary rounded-lg text-sm font-medium hover:bg-border/30 transition-colors"
          >
            Dashboard
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted">
          Need help?{' '}
          <a href="mailto:support@sems.demo" className="text-accent hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
