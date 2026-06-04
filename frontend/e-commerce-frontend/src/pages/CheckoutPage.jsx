import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import LuxuryPageHeader from '../components/common/LuxuryPageHeader';
import { useColorMode } from '../context/ColorModeContext';
import { cartApi } from '../api/cart';
import { couponsApi } from '../api/coupons';
import { ordersApi } from '../api/orders';
import { shippingAddressesApi } from '../api/shippingAddresses';
import { storefrontApi } from '../api/storefront';
import AddressFormFields from '../components/AddressFormFields';
import DevPaymentForm from '../components/DevPaymentForm';
import PricingSummary from '../components/PricingSummary';
import StripePaymentForm from '../components/StripePaymentForm';
import { formatAddressLine, validatePostalCode } from '../utils/address';
import { estimateCheckout, SHIPPING_OPTIONS } from '../utils/checkoutPricing';
import { showError, showSuccess } from '../utils/toast';

const CHECKOUT_DRAFT_KEY = 'shopverse:checkout-draft:v2';
const steps = ['Cart', 'Shipping', 'Payment', 'Confirmation'];

const emptyForm = {
  label: '',
  shippingStreet: '',
  shippingCity: '',
  shippingState: '',
  shippingZipCode: '',
  shippingCountry: 'United States',
  shippingLatitude: '',
  shippingLongitude: '',
};

function cartSignature(cart) {
  return (cart?.items || [])
    .map((item) => `${item.id || item.productId}:${item.productId}:${item.variantId || ''}:${item.quantity}:${item.lineTotal}`)
    .sort()
    .join('|');
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || 'null');
    return draft && typeof draft === 'object' ? draft : null;
  } catch {
    return null;
  }
}

function saveDraft(draft) {
  localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
    ...draft,
    savedAt: new Date().toISOString(),
  }));
}

function clearDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const restoredDraft = useMemo(() => loadDraft(), []);
  const [cart, setCart] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState(restoredDraft?.addressMode || 'saved');
  const [selectedAddressId, setSelectedAddressId] = useState(restoredDraft?.selectedAddressId || null);
  const [form, setForm] = useState(restoredDraft?.form || emptyForm);
  const [couponCode, setCouponCode] = useState(restoredDraft?.couponCode || '');
  const [appliedDiscount, setAppliedDiscount] = useState(restoredDraft?.appliedDiscount || 0);
  const [appliedFreeShipping, setAppliedFreeShipping] = useState(Boolean(restoredDraft?.appliedFreeShipping));
  const [couponMessage, setCouponMessage] = useState(restoredDraft?.couponMessage || '');
  const [shippingMethod, setShippingMethod] = useState(restoredDraft?.shippingMethod || 'STANDARD');
  const [checkout, setCheckout] = useState(restoredDraft?.orderId ? { orderId: restoredDraft.orderId } : null);
  const [orderBreakdown, setOrderBreakdown] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');
  const [cartWarning, setCartWarning] = useState('');
  const [paymentWarning, setPaymentWarning] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(restoredDraft?.orderId ? 'payment' : 'shipping');
  const [cartSnapshot, setCartSnapshot] = useState(restoredDraft?.cartSignature || '');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      cartApi.get({ signal: controller.signal, cache: false }),
      shippingAddressesApi.listAll({ signal: controller.signal }),
      storefrontApi.settings(),
    ])
      .then(([cartData, addresses, settings]) => {
        setCart(cartData);
        setSavedAddresses(addresses);
        setStoreSettings(settings);
        if (!restoredDraft) {
          if (addresses.length > 0) {
            const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddressMode('saved');
          } else {
            setAddressMode('new');
          }
        }
        if (restoredDraft?.cartSignature && restoredDraft.cartSignature !== cartSignature(cartData)) {
          setCartWarning('Your cart changed since checkout started. Return to cart to review items before paying.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [restoredDraft]);

  useEffect(() => {
    if (!cart) return;
    saveDraft({
      addressMode,
      selectedAddressId,
      form,
      couponCode,
      appliedDiscount,
      appliedFreeShipping,
      couponMessage,
      shippingMethod,
      orderId: checkout?.orderId || null,
      cartSignature: cartSnapshot || cartSignature(cart),
    });
  }, [
    addressMode,
    selectedAddressId,
    form,
    couponCode,
    appliedDiscount,
    appliedFreeShipping,
    couponMessage,
    shippingMethod,
    checkout?.orderId,
    cart,
    cartSnapshot,
  ]);

  useEffect(() => {
    if (!checkout?.orderId || checkout.clientSecret || checkout.devMode === true) return;
    ordersApi.get(checkout.orderId)
      .then((order) => {
        if (order.status !== 'AWAITING_PAYMENT') {
          setPaymentWarning('This checkout is no longer waiting for payment. Review your order history before paying.');
          return;
        }
        setOrderBreakdown(order);
      })
      .catch(() => {
        setPaymentWarning('Your previous checkout could not be resumed. Review your cart and start checkout again.');
      });
  }, [checkout?.orderId, checkout?.clientSecret, checkout?.devMode]);

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const estimate = useMemo(() => {
    if (!cart) return null;
    const destination = selectedAddress
      ? { state: selectedAddress.shippingState, country: selectedAddress.shippingCountry }
      : { state: form.shippingState, country: form.shippingCountry };
    return estimateCheckout(cart.totalAmount, appliedDiscount, shippingMethod, appliedFreeShipping, storeSettings || {}, destination);
  }, [cart, appliedDiscount, shippingMethod, appliedFreeShipping, storeSettings, selectedAddress, form.shippingState, form.shippingCountry]);

  const summary = orderBreakdown || estimate;
  const activeStep = step === 'shipping' ? 1 : step === 'payment' ? 2 : 3;

  const buildCheckoutPayload = () => {
    const base =
      addressMode === 'saved' && selectedAddressId
        ? { shippingAddressId: selectedAddressId }
        : {
            label: form.label || null,
            shippingStreet: form.shippingStreet,
            shippingCity: form.shippingCity,
            shippingState: form.shippingState,
            shippingZipCode: form.shippingZipCode,
            shippingCountry: form.shippingCountry,
            shippingLatitude: form.shippingLatitude === '' ? null : Number(form.shippingLatitude),
            shippingLongitude: form.shippingLongitude === '' ? null : Number(form.shippingLongitude),
          };
    return {
      ...base,
      couponCode: couponCode.trim() || null,
      shippingMethod,
    };
  };

  const refreshCartStatus = async () => {
    const latestCart = await cartApi.get({ cache: false });
    setCart(latestCart);
    if (!latestCart.items?.length) {
      setCartWarning('Your cart is empty. This checkout cannot continue.');
      return false;
    }
    if (cartSnapshot && cartSnapshot !== cartSignature(latestCart)) {
      setCartWarning('Your cart changed since checkout started. Return to cart to review items before paying.');
      return false;
    }
    return true;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    try {
      const res = await couponsApi.validate(couponCode.trim(), cart.totalAmount);
      if (res.valid) {
        setAppliedDiscount(res.discountAmount);
        setAppliedFreeShipping(Boolean(res.freeShipping));
        setCouponMessage(res.message);
        showSuccess('Coupon applied');
      } else {
        setAppliedDiscount(0);
        setAppliedFreeShipping(false);
        setCouponMessage(res.message);
        showError(res.message);
      }
    } catch (err) {
      setAppliedDiscount(0);
      setAppliedFreeShipping(false);
      showError(err.message);
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPaymentWarning('');
    const nextErrors = addressMode === 'new' ? validateCheckoutAddress(form) : {};
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Fix the highlighted shipping fields before continuing.');
      setLoading(false);
      return;
    }
    try {
      const latestCart = await cartApi.get({ cache: false });
      setCart(latestCart);
      if (!latestCart.items?.length) {
        setCartWarning('Your cart is empty. Add items before continuing checkout.');
        return;
      }

      const existingSnapshot = cartSnapshot || cartSignature(latestCart);
      if (cartSnapshot && cartSnapshot !== cartSignature(latestCart)) {
        setCartWarning('Your cart changed since checkout started. Return to cart to review items before paying.');
        return;
      }

      const init = checkout?.orderId
        ? await ordersApi.updateCheckout(checkout.orderId, buildCheckoutPayload())
        : await ordersApi.initiateCheckout(buildCheckoutPayload());
      setCartSnapshot(existingSnapshot);
      setCheckout(init);
      const order = await ordersApi.get(init.orderId);
      setOrderBreakdown(order);
      setFieldErrors({});
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

  const editShipping = () => {
    setPaymentWarning('');
    setStep('shipping');
  };

  const returnToCart = async () => {
    setLoading(true);
    setError('');
    try {
      if (checkout?.orderId) {
        await ordersApi.cancel(checkout.orderId);
      }
      clearDraft();
      navigate('/cart', {
        state: {
          checkoutReturned: true,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const makeCheckoutDefault = async (addressId) => {
    try {
      await shippingAddressesApi.setDefault(addressId);
      const addresses = await shippingAddressesApi.listAll({ cache: false });
      setSavedAddresses(addresses);
      setSelectedAddressId(addressId);
      showSuccess('Default address updated');
    } catch (err) {
      showError(err.message);
    }
  };

  const handlePaymentSuccess = async () => {
    const stillValid = await refreshCartStatus();
    if (!stillValid) return;
    const order = await ordersApi.confirmPayment(checkout.orderId);
    clearDraft();
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
          <Typography variant="h5" gutterBottom>Your cart is empty</Typography>
          <Typography color="text.secondary">
            Checkout cannot continue because there are no items to reserve or pay for.
          </Typography>
          <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
            Continue shopping
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <LuxuryPageHeader
        eyebrow="Checkout salon"
        title="Checkout"
        subtitle="A guided, resumable checkout with shipping, coupons, totals, and payment kept in clear stages."
        chips={[step === 'shipping' ? 'Shipping' : 'Payment', `${cart.totalItems} items`]}
      />
      <Stepper activeStep={activeStep} sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {(cartWarning || paymentWarning) && (
            <Alert
              severity={cartWarning ? 'warning' : 'info'}
              sx={{ mb: 2 }}
              action={cartWarning ? (
                <Button color="inherit" size="small" onClick={returnToCart}>
                  Return to cart
                </Button>
              ) : null}
            >
              {cartWarning || paymentWarning}
            </Alert>
          )}

          {step === 'shipping' && (
            <Card component="form" onSubmit={handleShippingSubmit}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {checkout?.orderId ? 'Edit shipping details' : 'Shipping address'}
                </Typography>
                {checkout?.orderId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Updating shipping recalculates the unpaid order total before payment. No payment has been captured yet.
                  </Alert>
                )}
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
                  <RadioGroup value={selectedAddressId || ''} onChange={(e) => setSelectedAddressId(Number(e.target.value))}>
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
                              <Typography variant="body2" color="text.secondary">{formatAddressLine(addr)}</Typography>
                              {!addr.isDefault && (
                                <Button
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    makeCheckoutDefault(addr.id);
                                  }}
                                >
                                  Make default
                                </Button>
                              )}
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
                    <AddressFormFields form={form} setForm={setForm} fieldPrefix="shipping" errors={fieldErrors} />
                  </Stack>
                )}

                {addressMode === 'saved' && selectedAddress && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Shipping to: <strong>{formatAddressLine(selectedAddress)}</strong>
                  </Typography>
                )}

                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Shipping method</Typography>
                <RadioGroup value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} sx={{ mb: 2 }}>
                  {Object.entries(SHIPPING_OPTIONS).map(([key, opt]) => {
                    const price = key === 'EXPRESS'
                      ? Number(storeSettings?.expressShippingCost ?? opt.price)
                      : Number(storeSettings?.standardShippingCost ?? opt.price);
                    return (
                      <FormControlLabel
                        key={key}
                        value={key}
                        control={<Radio />}
                        label={`${opt.label} - $${price.toFixed(2)}`}
                      />
                    );
                  })}
                </RadioGroup>

                <Typography variant="subtitle1" fontWeight={600}>Coupon</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                  <TextField fullWidth size="small" placeholder="e.g. SAVE10 or WELCOME5" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  <Button variant="outlined" onClick={applyCoupon}>Apply</Button>
                </Stack>
                {couponMessage && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{couponMessage}</Typography>}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button type="submit" variant="contained" disabled={loading || Boolean(cartWarning)} fullWidth>
                    {loading ? 'Updating checkout...' : checkout?.orderId ? 'Save shipping and return to payment' : 'Continue to payment'}
                  </Button>
                  <Button type="button" variant="outlined" color="warning" disabled={loading} onClick={returnToCart}>
                    Return to cart
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Returning to cart cancels this unpaid checkout order. Your cart items remain available for review.
                </Typography>
                <Link component={RouterLink} to="/addresses" variant="body2" display="block" sx={{ mt: 2 }}>
                  Manage saved addresses
                </Link>
              </CardContent>
            </Card>
          )}

          {step === 'payment' && checkout && (
            <Card>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6">Payment</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order #{checkout.orderId} {summary?.totalAmount || checkout.totalAmount ? `- $${Number(summary?.totalAmount || checkout.totalAmount).toFixed(2)}` : ''}
                    </Typography>
                  </Box>
                  <Button variant="outlined" onClick={editShipping}>Edit shipping</Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {cartWarning ? (
                  <Alert severity="warning">
                    Payment is paused until you review the cart changes.
                  </Alert>
                ) : checkout.devMode ? (
                  <DevPaymentForm orderId={checkout.orderId} totalAmount={summary?.totalAmount || checkout.totalAmount} onSuccess={handlePaymentSuccess} />
                ) : (
                  stripePromise &&
                  checkout.clientSecret && (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: checkout.clientSecret,
                        appearance: { theme: mode === 'dark' ? 'night' : 'stripe' },
                      }}
                    >
                      <StripePaymentForm
                        orderId={checkout.orderId}
                        totalAmount={summary?.totalAmount || checkout.totalAmount}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  )
                )}
                <Button color="warning" sx={{ mt: 2 }} onClick={returnToCart} disabled={loading}>
                  Return to cart
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Returning to cart cancels this unpaid checkout order and stops the current payment attempt.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              p: 2.5,
              position: 'sticky',
              top: { xs: 'auto', md: 88 },
              bottom: { xs: 0, md: 'auto' },
              zIndex: { xs: 9, md: 1 },
              mx: { xs: -2, sm: 0 },
              borderRadius: { xs: '16px 16px 0 0', sm: 2 },
              boxShadow: { xs: 6, md: 1 },
            }}
          >
            <Typography variant="h6" gutterBottom>Order summary</Typography>
            <TableContainer
              sx={{
                mb: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                overflow: 'hidden',
              }}
            >
              <Table size="small" aria-label="Checkout items">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ px: 1.5, py: 1.15, color: 'primary.contrastText', fontSize: 12, fontWeight: 800, borderBottom: 0 }}>Item</TableCell>
                    <TableCell align="center" sx={{ px: 1, py: 1.15, color: 'primary.contrastText', fontSize: 12, fontWeight: 800, borderBottom: 0 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ px: 1.5, py: 1.15, color: 'primary.contrastText', fontSize: 12, fontWeight: 800, borderBottom: 0 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.id || `${item.productId}-${item.variantId || 'base'}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ px: 1.5, py: 1.25, fontWeight: 600 }}>
                        {item.productName}
                        {item.variantName && (
                          <Typography variant="caption" display="block" color="text.secondary">{item.variantName}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1, py: 1.25, color: 'text.secondary' }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ px: 1.5, py: 1.25, fontWeight: 700 }}>${Number(item.lineTotal).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {summary && (
              <PricingSummary
                subtotal={summary.subtotalAmount ?? summary.subtotal}
                discount={summary.discountAmount ?? summary.discount}
                shipping={summary.shippingCost ?? summary.shipping}
                tax={summary.taxAmount ?? summary.tax}
                total={summary.totalAmount ?? summary.total}
                couponCode={summary.couponCode || (appliedDiscount > 0 || appliedFreeShipping ? couponCode : null)}
                shippingMethod={summary.shippingMethod || shippingMethod}
              />
            )}
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

function validateCheckoutAddress(form) {
  const errors = {};
  if (!form.shippingStreet.trim()) errors.shippingStreet = 'Street address is required.';
  if (!form.shippingCity.trim()) errors.shippingCity = 'City is required.';
  const postalError = validatePostalCode(form.shippingCountry, form.shippingZipCode);
  if (postalError) errors.shippingZipCode = postalError;
  return errors;
}
