import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import PaymentCard from './PaymentCard';

export default function StripePaymentForm({ orderId, totalAmount, onSuccess }) {
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
    <PaymentCard
      title="Pay with card"
      subtitle="Powered by Stripe — test card 4242 4242 4242 4242"
      orderId={orderId}
      totalAmount={totalAmount}
      mode="stripe"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <PaymentElement options={{ layout: 'tabs' }} />
          <Typography variant="caption" color="text.secondary">
            We accept Visa, Mastercard, Amex, and more. Use any future expiry and CVC in test mode.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" size="large" fullWidth disabled={!stripe || processing}>
            {processing ? 'Processing payment...' : 'Pay now'}
          </Button>
        </Stack>
      </Box>
    </PaymentCard>
  );
}
