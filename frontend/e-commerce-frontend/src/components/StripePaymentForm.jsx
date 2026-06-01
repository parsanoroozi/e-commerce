import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import PaymentCard from './PaymentCard';

export default function StripePaymentForm({ orderId, totalAmount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [declined, setDeclined] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');
    setDeclined(false);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      const paymentFailed = stripeError.type === 'card_error' || stripeError.code === 'card_declined';
      setDeclined(paymentFailed);
      setError(stripeError.message || 'Payment failed. Check your card details or try another payment method.');
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
          {error && (
            <Alert severity="error">
              <Typography variant="body2" fontWeight={700}>
                {declined ? 'Payment was declined' : 'Payment could not be completed'}
              </Typography>
              <Typography variant="body2">{error}</Typography>
              {declined && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  No charge was captured. Use a different card, fix the card details, or return to cart if you need to change the order.
                </Typography>
              )}
            </Alert>
          )}
          <Button type="submit" variant="contained" size="large" fullWidth disabled={!stripe || processing}>
            {processing ? 'Processing payment...' : 'Pay now'}
          </Button>
        </Stack>
      </Box>
    </PaymentCard>
  );
}
