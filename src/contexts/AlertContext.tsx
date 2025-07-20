// src/contexts/AlertContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import GlobalAlert, { GlobalAlertRef } from '@/components/GlobalAlert/globalAlert';
import { AlertColor } from '@mui/material'

const AlertContext = createContext<React.RefObject<GlobalAlertRef> | null>(null);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const alertRef = useRef<GlobalAlertRef>(null);
  
  return (
    <AlertContext.Provider value={alertRef}>
      {children}
      <GlobalAlert ref={alertRef} />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const alertRef = useContext(AlertContext);
  
  if (!alertRef) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  
  return {
    showAlert: (severity: AlertColor, message: string) => {
      if (alertRef.current) {
        alertRef.current.showAlert(severity, message);
      }
    }
  };
};