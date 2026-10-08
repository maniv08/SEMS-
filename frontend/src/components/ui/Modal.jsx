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
