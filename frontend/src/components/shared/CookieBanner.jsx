import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if consent has already been given (or rejected)
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
    // Initialize analytics here if they were implemented
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-surface border border-border shadow-2xl rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-primary mb-1">We use cookies</h3>
          <p className="text-sm text-muted">
            We use essential cookies to keep you logged in. We'd also like to set optional analytics cookies to help us improve the experience. You can choose to accept or reject them. See our <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a> for more details.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button variant="secondary" onClick={handleReject} className="flex-1 sm:flex-none">
            Reject Non-Essential
          </Button>
          <Button onClick={handleAccept} className="flex-1 sm:flex-none bg-brand text-white hover:bg-brand/90">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
