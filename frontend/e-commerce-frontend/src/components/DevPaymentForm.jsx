import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import PaymentCard from './PaymentCard';

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
    <PaymentCard
      title="Demo checkout"
      subtitle="Stripe is not configured — complete a test payment locally"
      orderId={orderId}
      totalAmount={totalAmount}
      mode="dev"
    >
      <Stack spacing={2}>
        <Alert severity="info" variant="outlined">
          No real charge. Use this to verify checkout, emails, and order flow end-to-end.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          After payment, you will receive an order confirmation email (check MailHog at localhost:8025).
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" size="large" fullWidth disabled={processing} onClick={handlePay}>
          {processing ? 'Completing order...' : 'Complete demo payment'}
        </Button>
      </Stack>
    </PaymentCard>
  );
}
