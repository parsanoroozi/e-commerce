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
    <div className="dev-payment">
      <p className="alert alert-success">
        Demo payment mode — no Stripe keys configured. Use this to test checkout locally.
      </p>
      <p className="muted">
        Order #{orderId} — ${Number(totalAmount).toFixed(2)}
      </p>
      {error && <p className="alert alert-error">{error}</p>}
      <button
        type="button"
        className="btn btn-primary full-width"
        disabled={processing}
        onClick={handlePay}
      >
        {processing ? 'Completing order...' : 'Complete demo payment'}
      </button>
    </div>
  );
}
