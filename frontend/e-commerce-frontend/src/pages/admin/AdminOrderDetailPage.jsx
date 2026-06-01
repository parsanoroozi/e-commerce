import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ordersApi } from '../../api/orders';
import EmptyState from '../../components/common/EmptyState';
import PricingSummary from '../../components/PricingSummary';
import { showError, showSuccess } from '../../utils/toast';

const FULFILLMENT_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [draft, setDraft] = useState(null);
  const [refund, setRefund] = useState({ amount: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    ordersApi.get(id)
      .then((data) => {
        setOrder(data);
        setDraft({
          status: data.status,
          shippingCarrier: data.shippingCarrier || '',
          trackingNumber: data.trackingNumber || '',
          adminNotes: data.adminNotes || '',
          timelineNote: '',
        });
        setRefund({
          amount: data.refundableAmount ? String(Number(data.refundableAmount).toFixed(2)) : '',
          reason: '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const saveFulfillment = async (status = draft.status) => {
    setSaving(true);
    setError('');
    try {
      const updated = await ordersApi.updateStatus(order.id, {
        status,
        shippingCarrier: draft.shippingCarrier || null,
        trackingNumber: draft.trackingNumber || null,
        adminNotes: draft.adminNotes,
        timelineNote: draft.timelineNote || null,
      });
      setOrder(updated);
      setDraft({
        status: updated.status,
        shippingCarrier: updated.shippingCarrier || '',
        trackingNumber: updated.trackingNumber || '',
        adminNotes: updated.adminNotes || '',
        timelineNote: '',
      });
      showSuccess('Order fulfillment updated');
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refundOrder = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await ordersApi.refund(order.id, {
        amount: Number(refund.amount),
        reason: refund.reason,
      });
      setOrder(updated);
      setRefund({ amount: '', reason: '' });
      showSuccess('Refund processed');
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      await adminApi.downloadInvoicePdf(order.id);
      showSuccess(`Invoice #${order.id} downloaded`);
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return <Typography color="text.secondary">Loading order...</Typography>;
  }

  if (error && !order) {
    return (
      <EmptyState
        severity="error"
        icon={<ReceiptLongOutlinedIcon />}
        title="Order could not load"
        message={error}
        onRetry={load}
      />
    );
  }

  const canRefund = Number(order.refundableAmount || 0) > 0
    && !['AWAITING_PAYMENT', 'CANCELLED', 'REFUNDED'].includes(order.status);

  return (
    <Box>
      <Button component={RouterLink} to="/admin/orders" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to orders
      </Button>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="h5">Order #{order.id}</Typography>
            <Chip label={order.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {order.customer ? `${order.customer.firstName} ${order.customer.lastName} - ${order.customer.email}` : 'Customer details unavailable'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Placed {new Date(order.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ReceiptLongOutlinedIcon />} onClick={downloadInvoice}>
          Invoice PDF
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Items</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={`${item.productId}-${item.variantId || 'base'}`}>
                        <TableCell>
                          {item.productName}
                          {item.variantName && (
                            <Typography variant="caption" display="block" color="text.secondary">{item.variantName}</Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.sku || '-'}</TableCell>
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

          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <LocalShippingOutlinedIcon color="primary" />
                <Typography variant="h6">Shipping and tracking</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {[order.shippingStreet, order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(', ')}
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select value={draft.status} onChange={(e) => updateDraft({ status: e.target.value })}>
                      {FULFILLMENT_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Carrier"
                    value={draft.shippingCarrier}
                    onChange={(e) => updateDraft({ shippingCarrier: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="Tracking number"
                    value={draft.trackingNumber}
                    onChange={(e) => updateDraft({ trackingNumber: e.target.value })}
                  />
                </Stack>
                <TextField
                  size="small"
                  label="Admin notes"
                  multiline
                  minRows={3}
                  value={draft.adminNotes}
                  onChange={(e) => updateDraft({ adminNotes: e.target.value })}
                />
                <TextField
                  size="small"
                  label="Timeline note"
                  value={draft.timelineNote}
                  onChange={(e) => updateDraft({ timelineNote: e.target.value })}
                  helperText="Shown in the internal staff timeline."
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {['PACKED', 'SHIPPED', 'DELIVERED'].map((status) => (
                    <Button
                      key={status}
                      variant={order.status === status ? 'contained' : 'outlined'}
                      disabled={saving || order.status === 'AWAITING_PAYMENT'}
                      onClick={() => saveFulfillment(status)}
                    >
                      Mark {status.toLowerCase()}
                    </Button>
                  ))}
                  <Button
                    variant="contained"
                    disabled={saving || order.status === 'AWAITING_PAYMENT'}
                    onClick={() => saveFulfillment()}
                  >
                    Save fulfillment
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2.5, mb: 3 }}>
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
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Refunds</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Refunded ${Number(order.refundedAmount || 0).toFixed(2)} of ${Number(order.totalAmount || 0).toFixed(2)}.
                Remaining refundable: ${Number(order.refundableAmount || 0).toFixed(2)}.
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  label="Refund amount"
                  type="number"
                  inputProps={{ min: 0.01, step: 0.01, max: Number(order.refundableAmount || 0) }}
                  value={refund.amount}
                  onChange={(e) => setRefund({ ...refund, amount: e.target.value })}
                />
                <TextField
                  size="small"
                  label="Refund reason"
                  value={refund.reason}
                  onChange={(e) => setRefund({ ...refund, reason: e.target.value })}
                />
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={saving || !canRefund || Number(refund.amount) <= 0 || !refund.reason.trim()}
                  onClick={refundOrder}
                >
                  Process refund
                </Button>
                {(order.refunds || []).map((entry) => (
                  <Box key={entry.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{entry.status} - ${Number(entry.amount).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">{entry.reason}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Staff timeline</Typography>
              <Stack spacing={1.5}>
                {(order.staffTimeline || []).length === 0 && (
                  <Typography color="text.secondary">No staff timeline events yet.</Typography>
                )}
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
                    {event.note && <Typography variant="body2" color="text.secondary">{event.note}</Typography>}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
