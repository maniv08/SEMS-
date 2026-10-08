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
