import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
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
    <form onSubmit={handleSubmit} className="stripe-form">
      <PaymentElement />
      {error && <p className="alert alert-error">{error}</p>}
      <button type="submit" className="btn btn-primary full-width" disabled={!stripe || processing}>
        {processing ? 'Processing payment...' : 'Pay now'}
      </button>
    </form>
  );
}
