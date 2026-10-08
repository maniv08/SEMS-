import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-brand/20 bg-brand/5 shadow-lg shadow-brand/10">
        <CardContent className="pt-8 pb-8 px-6 text-center">
          <div className="mx-auto w-16 h-16 bg-brand text-white rounded-full flex items-center justify-center mb-6 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-primary mb-2">Welcome to Smart Energy!</h1>
          <p className="text-muted text-sm mb-8">
            Your account has been successfully created. You can now monitor your energy usage, set alerts, and start saving.
          </p>
          
          <div className="space-y-4">
            <Link to="/dashboard" className="block w-full">
              <Button className="w-full text-base py-3">Go to Dashboard</Button>
            </Link>
            <Link to="/profile" className="block text-sm text-accent hover:underline">
              Complete your profile settings
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
