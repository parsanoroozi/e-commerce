import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Alert, Box, Button, Stack } from '@mui/material';
import { useState } from 'react';

export default function StripePaymentForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    try {
      await onSuccess();
    } catch (err) {
      setError(err.message || 'Could not confirm order');
      setProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <PaymentElement />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" size="large" fullWidth disabled={!stripe || processing}>
          {processing ? 'Processing payment...' : 'Pay now'}
        </Button>
      </Stack>
    </Box>
  );
}
