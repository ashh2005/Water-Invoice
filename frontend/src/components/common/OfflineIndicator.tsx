import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const OfflineIndicator: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Snackbar open={offline} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity="warning" variant="filled">
        You are offline. Some features may not be available.
      </Alert>
    </Snackbar>
  );
};
