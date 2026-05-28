import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { ordersApi } from '../api/orders';
import DevPaymentForm from '../components/DevPaymentForm';
import StripePaymentForm from '../components/StripePaymentForm';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState({
    shippingStreet: '',
    shippingCity: '',
    shippingZipCode: '',
    shippingCountry: '',
  });
  const [checkout, setCheckout] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('shipping');

  useEffect(() => {
    cartApi.get().then(setCart).catch((err) => setError(err.message));
  }, []);

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const init = await ordersApi.initiateCheckout(form);
      setCheckout(init);
      if (!init.devMode && init.publishableKey) {
        setStripePromise(loadStripe(init.publishableKey));
      }
      setStep('payment');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    const order = await ordersApi.confirmPayment(checkout.orderId);
    navigate(`/orders/${order.id}`, { state: { paymentSuccess: true } });
  };

  if (!cart) {
    return <p className="page-center">Loading checkout...</p>;
  }

  if (!cart.items?.length) {
    return (
      <div className="container page empty-state">
        <p>Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 'shipping' && (
            <form className="checkout-form" onSubmit={handleShippingSubmit}>
              <h2>Shipping address</h2>
              {error && <p className="alert alert-error">{error}</p>}
              <label>
                Street address
                <input
                  required
                  value={form.shippingStreet}
                  onChange={(e) => setForm({ ...form, shippingStreet: e.target.value })}
                />
              </label>
              <label>
                City
                <input
                  required
                  value={form.shippingCity}
                  onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                />
              </label>
              <label>
                ZIP / Postal code
                <input
                  required
                  value={form.shippingZipCode}
                  onChange={(e) => setForm({ ...form, shippingZipCode: e.target.value })}
                />
              </label>
              <label>
                Country
                <input
                  required
                  value={form.shippingCountry}
                  onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Preparing payment...' : 'Continue to payment'}
              </button>
            </form>
          )}

          {step === 'payment' && checkout && (
            <div className="checkout-payment">
              <h2>Payment</h2>
              {checkout.devMode ? (
                <DevPaymentForm
                  orderId={checkout.orderId}
                  totalAmount={checkout.totalAmount}
                  onSuccess={handlePaymentSuccess}
                />
              ) : (
                stripePromise &&
                checkout.clientSecret && (
                  <>
                    <p className="muted">
                      Order #{checkout.orderId} — $
                      {Number(checkout.totalAmount).toFixed(2)}
                    </p>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: checkout.clientSecret,
                        appearance: { theme: 'night' },
                      }}
                    >
                      <StripePaymentForm onSuccess={handlePaymentSuccess} />
                    </Elements>
                  </>
                )
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep('shipping')}
              >
                Back to shipping
              </button>
            </div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <ul className="checkout-summary-list">
            {cart.items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>${Number(item.lineTotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="product-price large">
            Total: ${Number(cart.totalAmount).toFixed(2)}
          </p>
        </aside>
      </div>
    </div>
  );
}
