import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { couponsApi } from '../api/coupons';
import { ordersApi } from '../api/orders';
import { shippingAddressesApi } from '../api/shippingAddresses';
import DevPaymentForm from '../components/DevPaymentForm';
import PricingSummary from '../components/PricingSummary';
import StripePaymentForm from '../components/StripePaymentForm';
import { estimateCheckout, SHIPPING_OPTIONS } from '../utils/checkoutPricing';
import { showError, showSuccess } from '../utils/toast';

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
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [shippingMethod, setShippingMethod] = useState('STANDARD');
  const [checkout, setCheckout] = useState(null);
  const [orderBreakdown, setOrderBreakdown] = useState(null);
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

  const estimate = useMemo(() => {
    if (!cart) return null;
    return estimateCheckout(cart.totalAmount, appliedDiscount, shippingMethod);
  }, [cart, appliedDiscount, shippingMethod]);

  const buildCheckoutPayload = () => {
    const base =
      addressMode === 'saved' && selectedAddressId
        ? { shippingAddressId: selectedAddressId }
        : {
            label: form.label || null,
            shippingStreet: form.shippingStreet,
            shippingCity: form.shippingCity,
            shippingZipCode: form.shippingZipCode,
            shippingCountry: form.shippingCountry,
          };
    return {
      ...base,
      couponCode: couponCode.trim() || null,
      shippingMethod,
    };
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    try {
      const res = await couponsApi.validate(couponCode.trim(), cart.totalAmount);
      if (res.valid) {
        setAppliedDiscount(res.discountAmount);
        setCouponMessage(res.message);
        showSuccess('Coupon applied');
      } else {
        setAppliedDiscount(0);
        setCouponMessage(res.message);
        showError(res.message);
      }
    } catch (err) {
      setAppliedDiscount(0);
      showError(err.message);
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const init = await ordersApi.initiateCheckout(buildCheckoutPayload());
      setCheckout(init);
      const order = await ordersApi.get(init.orderId);
      setOrderBreakdown(order);
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
      <div className="container page empty-state card-panel">
        <p>Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const summary = orderBreakdown || estimate;

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="step-indicator">
        <span className={step === 'shipping' ? 'active' : ''}>1. Shipping</span>
        <span className={step === 'payment' ? 'active' : ''}>2. Payment</span>
      </div>
      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 'shipping' && (
            <form className="checkout-form checkout-form-wide card-panel" onSubmit={handleShippingSubmit}>
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
                            {addr.isDefault && <span className="address-badge">Default</span>}
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
                  <p className="muted">Saved automatically for your next orders.</p>
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

              <h3 className="section-title">Shipping method</h3>
              <div className="shipping-options">
                {Object.entries(SHIPPING_OPTIONS).map(([key, opt]) => (
                  <label key={key} className="shipping-option">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={key}
                      checked={shippingMethod === key}
                      onChange={() => setShippingMethod(key)}
                    />
                    <span>
                      {opt.label} — ${opt.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>

              <h3 className="section-title">Coupon</h3>
              <div className="coupon-row">
                <input
                  placeholder="e.g. SAVE10 or WELCOME5"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMessage && <p className="muted">{couponMessage}</p>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Preparing payment...' : 'Continue to payment'}
              </button>
              <Link to="/addresses" className="muted manage-addresses-link">
                Manage saved addresses
              </Link>
            </form>
          )}

          {step === 'payment' && checkout && (
            <div className="checkout-payment card-panel">
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
                      Order #{checkout.orderId} — ${Number(checkout.totalAmount).toFixed(2)}
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
              <button type="button" className="btn btn-ghost" onClick={() => setStep('shipping')}>
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
          {summary && (
            <PricingSummary
              subtotal={summary.subtotalAmount ?? summary.subtotal}
              discount={summary.discountAmount ?? summary.discount}
              shipping={summary.shippingCost ?? summary.shipping}
              tax={summary.taxAmount ?? summary.tax}
              total={summary.totalAmount ?? summary.total}
              couponCode={summary.couponCode || (appliedDiscount > 0 ? couponCode : null)}
              shippingMethod={summary.shippingMethod || shippingMethod}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
