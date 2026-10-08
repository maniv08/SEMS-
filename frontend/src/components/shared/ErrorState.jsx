import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-critical/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-critical" />
      </div>
      <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
