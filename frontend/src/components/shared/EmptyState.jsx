import React from 'react';
import { InboxIcon } from 'lucide-react';

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-border/50 flex items-center justify-center mb-4">
        <InboxIcon className="h-6 w-6 text-muted" />
      </div>
      <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
