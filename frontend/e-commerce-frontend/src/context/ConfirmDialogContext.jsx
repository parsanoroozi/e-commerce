import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [request, setRequest] = useState(null);

  const confirm = useCallback((options) =>
    new Promise((resolve) => {
      setRequest({
        title: options.title || 'Confirm action',
        description: options.description || 'Are you sure you want to continue?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        color: options.color || 'error',
        resolve,
      });
    }), []);

  const close = useCallback((confirmed) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={Boolean(request)}
        onClose={() => close(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{request?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {request?.description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => close(false)}>{request?.cancelText}</Button>
          <Button variant="contained" color={request?.color} onClick={() => close(true)} autoFocus>
            {request?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx.confirm;
}
