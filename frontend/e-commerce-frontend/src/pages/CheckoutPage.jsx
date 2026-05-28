import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { ordersApi } from '../api/orders';
import { shippingAddressesApi } from '../api/shippingAddresses';
import DevPaymentForm from '../components/DevPaymentForm';
import StripePaymentForm from '../components/StripePaymentForm';

const emptyForm = {
  label: '',
  shippingStreet: '',
  shippingCity: '',
  shippingZipCode: '',
  shippingCountry: '',
};

function formatAddress(addr) {
  const parts = [addr.street, addr.city, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(', ');
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('saved');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [checkout, setCheckout] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('shipping');

  useEffect(() => {
    Promise.all([cartApi.get(), shippingAddressesApi.list()])
      .then(([cartData, addresses]) => {
        setCart(cartData);
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          setSelectedAddressId(defaultAddr.id);
          setAddressMode('saved');
        } else {
          setAddressMode('new');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const buildCheckoutPayload = () => {
    if (addressMode === 'saved' && selectedAddressId) {
      return { shippingAddressId: selectedAddressId };
    }
    return {
      label: form.label || null,
      shippingStreet: form.shippingStreet,
      shippingCity: form.shippingCity,
      shippingZipCode: form.shippingZipCode,
      shippingCountry: form.shippingCountry,
    };
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const init = await ordersApi.initiateCheckout(buildCheckoutPayload());
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

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 'shipping' && (
            <form className="checkout-form checkout-form-wide" onSubmit={handleShippingSubmit}>
              <h2>Shipping address</h2>
              {error && <p className="alert alert-error">{error}</p>}

              {savedAddresses.length > 0 && (
                <div className="address-mode-tabs">
                  <button
                    type="button"
                    className={addressMode === 'saved' ? 'active' : ''}
                    onClick={() => setAddressMode('saved')}
                  >
                    Saved addresses
                  </button>
                  <button
                    type="button"
                    className={addressMode === 'new' ? 'active' : ''}
                    onClick={() => setAddressMode('new')}
                  >
                    New address
                  </button>
                </div>
              )}

              {addressMode === 'saved' && savedAddresses.length > 0 && (
                <ul className="address-list">
                  {savedAddresses.map((addr) => (
                    <li key={addr.id}>
                      <label className="address-card">
                        <input
                          type="radio"
                          name="shippingAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div>
                          <strong>
                            {addr.label || 'Address'}
                            {addr.isDefault && (
                              <span className="address-badge">Default</span>
                            )}
                          </strong>
                          <p className="muted">{formatAddress(addr)}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {addressMode === 'new' && (
                <>
                  <p className="muted">
                    This address will be saved automatically for your next orders.
                  </p>
                  <label>
                    Label (optional)
                    <input
                      placeholder="Home, Work..."
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                  </label>
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
                </>
              )}

              {addressMode === 'saved' && selectedAddress && (
                <p className="muted shipping-confirm">
                  Shipping to: <strong>{formatAddress(selectedAddress)}</strong>
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Preparing payment...' : 'Continue to payment'}
              </button>
              <Link to="/addresses" className="muted manage-addresses-link">
                Manage saved addresses
              </Link>
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
