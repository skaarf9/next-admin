"use client"
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';

export interface GlobalAlertRef {
  showAlert: (severity: AlertColor, message: string) => void;
}

const GlobalAlert = forwardRef<GlobalAlertRef>((props, ref) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertColor>('info');

  const showAlert = (severity: AlertColor, message: string) => {
    setAlertSeverity(severity);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  useImperativeHandle(ref, () => ({
    showAlert
  }));

  const handleClose = () => {
    setAlertOpen(false);
  };

  return (
    <Snackbar
      open={alertOpen}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      style={{
        position: 'fixed',
        zIndex: 99999,
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <Alert 
        onClose={handleClose} 
        severity={alertSeverity}
        sx={{ 
          minWidth: 300,
          boxShadow: 3,
          fontSize: '1rem',
          fontWeight: 'bold'
        }}
      >
        {alertMessage}
      </Alert>
    </Snackbar>
  );
});

export default GlobalAlert;