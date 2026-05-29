import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';

export default function DevPaymentForm({ orderId, totalAmount, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      await onSuccess();
    } catch (err) {
      setError(err.message || 'Could not complete order');
      setProcessing(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Demo payment mode — no Stripe keys configured. Use this to test checkout locally.
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Order #{orderId} — ${Number(totalAmount).toFixed(2)}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" fullWidth disabled={processing} onClick={handlePay}>
        {processing ? 'Completing order...' : 'Complete demo payment'}
      </Button>
    </Stack>
  );
}
