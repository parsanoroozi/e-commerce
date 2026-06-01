import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { subscribeToApiChanges } from '../api/client';
import { ordersApi } from '../api/orders';
import OrderTimeline, { OrderTimelineMobile } from '../components/OrderTimeline';
import PageContainer from '../components/layout/PageContainer';
import PricingSummary from '../components/PricingSummary';
import { useConfirm } from '../context/ConfirmDialogContext';
import { showError, showSuccess } from '../utils/toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const confirm = useConfirm();

  const loadOrder = useCallback(() => {
    setLoading(true);
    ordersApi
      .get(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    return subscribeToApiChanges((change) => {
      if (change?.resources?.includes('orders')) {
        loadOrder();
      }
    });
  }, [loadOrder]);

  const canCancel = order && (order.status === 'CONFIRMED' || order.status === 'PENDING');

  const handleCancel = async () => {
    if (!(await confirm({
      title: 'Cancel order?',
      description: 'The order will be cancelled and reserved stock will be released.',
      confirmText: 'Cancel order',
    }))) return;
    setCancelling(true);
    try {
      setOrder(await ordersApi.cancel(id));
      showSuccess('Order cancelled');
    } catch (err) {
      showError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!order) return null;

  return (
    <PageContainer>
      <Button component={RouterLink} to="/orders" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to orders
      </Button>
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
        <Typography variant="h4">Order #{order.id}</Typography>
        <Chip label={order.status} size="small" />
      </Stack>
      {location.state?.paymentSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment successful! A confirmation email has been sent to your inbox.
        </Alert>
      )}
      <OrderTimeline status={order.status} />
      <OrderTimelineMobile status={order.status} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Placed: {new Date(order.createdAt).toLocaleString()}
      </Typography>
      {canCancel && (
        <Button variant="outlined" color="error" disabled={cancelling} onClick={handleCancel} sx={{ mb: 3 }}>
          {cancelling ? 'Cancelling...' : 'Cancel order'}
        </Button>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Shipping</Typography>
              <Typography variant="body2" paragraph>
                {[order.shippingStreet, order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(', ')}
              </Typography>
              {order.shippingLatitude != null && order.shippingLongitude != null && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Map: {Number(order.shippingLatitude).toFixed(5)}, {Number(order.shippingLongitude).toFixed(5)}
                </Typography>
              )}
              {order.shippingMethod && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Method: {order.shippingMethod}
                </Typography>
              )}
              {(order.shippingCarrier || order.trackingNumber) && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Shipment tracking</Typography>
                  {order.shippingCarrier && (
                    <Typography variant="body2" color="text.secondary">Carrier: {order.shippingCarrier}</Typography>
                  )}
                  {order.trackingNumber && (
                    <Typography variant="body2" color="text.secondary">Tracking: {order.trackingNumber}</Typography>
                  )}
                  {order.trackingUrl && (
                    <MuiLink href={order.trackingUrl} target="_blank" rel="noreferrer" variant="body2">
                      Track shipment
                    </MuiLink>
                  )}
                </Box>
              )}
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Items</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          {item.productName}
                          {item.variantName && (
                            <Typography variant="caption" display="block" color="text.secondary">{item.variantName}</Typography>
                          )}
                          {item.sku && (
                            <Typography variant="caption" display="block" color="text.secondary">SKU: {item.sku}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell align="right">${Number(item.lineTotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Typography variant="h6" gutterBottom>Payment summary</Typography>
            <PricingSummary
              subtotal={order.subtotalAmount}
              discount={order.discountAmount}
              shipping={order.shippingCost}
              tax={order.taxAmount}
              total={order.totalAmount}
              couponCode={order.couponCode}
              shippingMethod={order.shippingMethod}
            />
            {Number(order.refundedAmount || 0) > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2">Refunds</Typography>
                <Typography variant="body2" color="text.secondary">
                  Refunded: ${Number(order.refundedAmount).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining refundable: ${Number(order.refundableAmount || 0).toFixed(2)}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {(order.refunds || []).map((refund) => (
                    <Box key={refund.id}>
                      <Typography variant="caption" display="block">
                        {refund.status} - ${Number(refund.amount).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {refund.reason}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Card>
          {(order.adminNotes || order.staffTimeline?.length > 0) && (
            <Card sx={{ p: 2.5, mt: 2 }}>
              <Typography variant="h6" gutterBottom>Staff timeline</Typography>
              {order.adminNotes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Admin notes</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {order.adminNotes}
                  </Typography>
                </Box>
              )}
              <Stack spacing={1.5}>
                {(order.staffTimeline || []).map((event) => (
                  <Box key={event.id} sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 1.5 }}>
                    <Typography variant="subtitle2">
                      {event.action} {event.fromStatus ? `${event.fromStatus} to ${event.toStatus}` : event.toStatus}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(event.createdAt).toLocaleString()} {event.adminEmail ? `by ${event.adminEmail}` : ''}
                    </Typography>
                    {(event.shippingCarrier || event.trackingNumber) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {[event.shippingCarrier, event.trackingNumber].filter(Boolean).join(' - ')}
                      </Typography>
                    )}
                    {event.note && (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {event.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Card>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
}
