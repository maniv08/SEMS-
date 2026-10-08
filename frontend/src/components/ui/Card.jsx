import React from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx("rounded-card border border-border bg-surface shadow-card text-primary", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={clsx("flex flex-col space-y-1.5 p-6", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
  return <h3 className={clsx("text-sm font-medium text-muted", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }) {
  return <div className={clsx("p-6 pt-0", className)} {...props}>{children}</div>;
}
