import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useColorMode } from '../context/ColorModeContext';
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
  const { mode } = useColorMode();
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
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!cart.items?.length) {
    return (
      <PageContainer>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography gutterBottom>Your cart is empty.</Typography>
          <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
            Continue shopping
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const summary = orderBreakdown || estimate;
  const activeStep = step === 'shipping' ? 0 : 1;

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>Checkout</Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
        <Step><StepLabel>Shipping</StepLabel></Step>
        <Step><StepLabel>Payment</StepLabel></Step>
      </Stepper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {step === 'shipping' && (
            <Card component="form" onSubmit={handleShippingSubmit}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Shipping address</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {savedAddresses.length > 0 && (
                  <ToggleButtonGroup
                    value={addressMode}
                    exclusive
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    onChange={(_, v) => v && setAddressMode(v)}
                  >
                    <ToggleButton value="saved">Saved addresses</ToggleButton>
                    <ToggleButton value="new">New address</ToggleButton>
                  </ToggleButtonGroup>
                )}

                {addressMode === 'saved' && savedAddresses.length > 0 && (
                  <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(Number(e.target.value))}>
                    {savedAddresses.map((addr) => (
                      <Card key={addr.id} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
                        <FormControlLabel
                          value={addr.id}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography fontWeight={600}>
                                {addr.label || 'Address'}
                                {addr.isDefault && (
                                  <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
                                    Default
                                  </Typography>
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">{formatAddress(addr)}</Typography>
                            </Box>
                          }
                        />
                      </Card>
                    ))}
                  </RadioGroup>
                )}

                {addressMode === 'new' && (
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Saved automatically for your next orders.</Typography>
                    <TextField label="Label (optional)" placeholder="Home, Work..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                    <TextField label="Street address" required value={form.shippingStreet} onChange={(e) => setForm({ ...form, shippingStreet: e.target.value })} />
                    <TextField label="City" required value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
                    <TextField label="ZIP / Postal code" required value={form.shippingZipCode} onChange={(e) => setForm({ ...form, shippingZipCode: e.target.value })} />
                    <TextField label="Country" required value={form.shippingCountry} onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })} />
                  </Stack>
                )}

                {addressMode === 'saved' && selectedAddress && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Shipping to: <strong>{formatAddress(selectedAddress)}</strong>
                  </Typography>
                )}

                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Shipping method</Typography>
                <RadioGroup value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} sx={{ mb: 2 }}>
                  {Object.entries(SHIPPING_OPTIONS).map(([key, opt]) => (
                    <FormControlLabel
                      key={key}
                      value={key}
                      control={<Radio />}
                      label={`${opt.label} — $${opt.price.toFixed(2)}`}
                    />
                  ))}
                </RadioGroup>

                <Typography variant="subtitle1" fontWeight={600}>Coupon</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                  <TextField fullWidth size="small" placeholder="e.g. SAVE10 or WELCOME5" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  <Button variant="outlined" onClick={applyCoupon}>Apply</Button>
                </Stack>
                {couponMessage && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{couponMessage}</Typography>}

                <Button type="submit" variant="contained" disabled={loading} fullWidth>
                  {loading ? 'Preparing payment...' : 'Continue to payment'}
                </Button>
                <Link component={RouterLink} to="/addresses" variant="body2" display="block" sx={{ mt: 2 }}>
                  Manage saved addresses
                </Link>
              </CardContent>
            </Card>
          )}

          {step === 'payment' && checkout && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payment</Typography>
                {checkout.devMode ? (
                  <DevPaymentForm orderId={checkout.orderId} totalAmount={checkout.totalAmount} onSuccess={handlePaymentSuccess} />
                ) : (
                  stripePromise &&
                  checkout.clientSecret && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Order #{checkout.orderId} — ${Number(checkout.totalAmount).toFixed(2)}
                      </Typography>
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: checkout.clientSecret,
                          appearance: { theme: mode === 'dark' ? 'night' : 'stripe' },
                        }}
                      >
                        <StripePaymentForm
                        orderId={checkout.orderId}
                        totalAmount={checkout.totalAmount}
                        onSuccess={handlePaymentSuccess}
                      />
                      </Elements>
                    </>
                  )
                )}
                <Button variant="outlined" onClick={() => setStep('shipping')} sx={{ mt: 2 }}>
                  Back to shipping
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Typography variant="h6" gutterBottom>Order summary</Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {cart.items.map((item) => (
                <Stack key={item.productId} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{item.productName} × {item.quantity}</Typography>
                  <Typography variant="body2">${Number(item.lineTotal).toFixed(2)}</Typography>
                </Stack>
              ))}
            </Stack>
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
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
