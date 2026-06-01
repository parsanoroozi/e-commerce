import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { subscribeToApiChanges } from '../../api/client';
import { ordersApi } from '../../api/orders';
import { showError, showSuccess } from '../../utils/toast';

const STATUSES = ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const FULFILLMENT_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrdersPage() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({});
  const [refundDrafts, setRefundDrafts] = useState({});

  const load = useCallback(() =>
    ordersApi.adminAll(page).then((data) => {
      setOrders(data.content);
      setPageData(data);
    }).catch((err) => setError(err.message)), [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeToApiChanges((change) => {
      if (change?.resources?.includes('orders')) {
        load();
      }
    });
  }, [load]);

  const initialDraft = (order) => ({
    status: order.status,
    shippingCarrier: order.shippingCarrier || '',
    trackingNumber: order.trackingNumber || '',
    adminNotes: order.adminNotes || '',
    timelineNote: '',
  });

  const draftFor = (order) => drafts[order.id] || initialDraft(order);

  const updateDraft = (order, patch) => {
    setDrafts((current) => ({
      ...current,
      [order.id]: {
        ...(current[order.id] || initialDraft(order)),
        ...patch,
      },
    }));
  };

  const updateStatus = async (order, status) => {
    const draft = draftFor(order);
    try {
      await ordersApi.updateStatus(order.id, {
        status,
        shippingCarrier: draft.shippingCarrier || null,
        trackingNumber: draft.trackingNumber || null,
        adminNotes: draft.adminNotes,
        timelineNote: draft.timelineNote || null,
      });
      setDrafts((current) => ({ ...current, [order.id]: { ...draft, status, timelineNote: '' } }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const refundDraftFor = (order) => refundDrafts[order.id] || {
    amount: order.refundableAmount ? String(Number(order.refundableAmount).toFixed(2)) : '',
    reason: '',
  };

  const updateRefundDraft = (order, patch) => {
    setRefundDrafts((current) => ({
      ...current,
      [order.id]: {
        ...refundDraftFor(order),
        ...patch,
      },
    }));
  };

  const refundOrder = async (order) => {
    const draft = refundDraftFor(order);
    try {
      await ordersApi.refund(order.id, {
        amount: Number(draft.amount),
        reason: draft.reason,
      });
      setRefundDrafts((current) => ({ ...current, [order.id]: { amount: '', reason: '' } }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadInvoice = async (order) => {
    try {
      await adminApi.downloadInvoicePdf(order.id);
      showSuccess(`Invoice #${order.id} downloaded`);
    } catch (err) {
      showError(err.message);
    }
  };

  const canRefund = (order) => (
    Number(order.refundableAmount || 0) > 0
    && !['AWAITING_PAYMENT', 'CANCELLED', 'REFUNDED'].includes(order.status)
  );

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const customerName = order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase()
        : '';
      const customerEmail = order.customer?.email?.toLowerCase() || '';
      const matchesSearch = !needle
        || String(order.id).includes(needle)
        || customerName.includes(needle)
        || customerEmail.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {}), [orders]);

  const renderOrderControls = (order, compact = false) => (
    <Stack spacing={1} sx={{ minWidth: compact ? 0 : { xs: 240, md: 360 } }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {['PACKED', 'SHIPPED', 'DELIVERED'].map((status) => (
          <Button
            key={status}
            size={compact ? 'medium' : 'small'}
            sx={{ minHeight: compact ? 44 : 36, flex: compact ? '1 1 110px' : '0 0 auto' }}
            variant={order.status === status ? 'contained' : 'outlined'}
            disabled={order.status === 'AWAITING_PAYMENT'}
            onClick={() => updateStatus(order, status)}
          >
            {status}
          </Button>
        ))}
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={draftFor(order).status}
            onChange={(e) => updateDraft(order, { status: e.target.value })}
          >
            {FULFILLMENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Carrier"
          value={draftFor(order).shippingCarrier}
          onChange={(e) => updateDraft(order, { shippingCarrier: e.target.value })}
        />
        <TextField
          size="small"
          label="Tracking"
          value={draftFor(order).trackingNumber}
          onChange={(e) => updateDraft(order, { trackingNumber: e.target.value })}
        />
      </Stack>
      <TextField
        size="small"
        label="Admin notes"
        multiline
        minRows={2}
        value={draftFor(order).adminNotes}
        onChange={(e) => updateDraft(order, { adminNotes: e.target.value })}
      />
      <TextField
        size="small"
        label="Timeline note"
        value={draftFor(order).timelineNote}
        onChange={(e) => updateDraft(order, { timelineNote: e.target.value })}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          size={compact ? 'medium' : 'small'}
          fullWidth={compact}
          sx={{ minHeight: compact ? 44 : 36 }}
          variant="contained"
          disabled={order.status === 'AWAITING_PAYMENT'}
          onClick={() => updateStatus(order, draftFor(order).status)}
        >
          Save fulfillment
        </Button>
        <Button
          size={compact ? 'medium' : 'small'}
          fullWidth={compact}
          sx={{ minHeight: compact ? 44 : 36 }}
          variant="outlined"
          onClick={() => downloadInvoice(order)}
        >
          Invoice PDF
        </Button>
      </Stack>
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Refunded ${Number(order.refundedAmount || 0).toFixed(2)} / refundable ${Number(order.refundableAmount || 0).toFixed(2)}
        </Typography>
        {order.refunds?.length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block">
            Last refund: {order.refunds[0].status} ${Number(order.refunds[0].amount).toFixed(2)}
          </Typography>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            label="Refund amount"
            type="number"
            inputProps={{ min: 0.01, step: 0.01, max: Number(order.refundableAmount || 0) }}
            value={refundDraftFor(order).amount}
            onChange={(e) => updateRefundDraft(order, { amount: e.target.value })}
          />
          <TextField
            size="small"
            label="Refund reason"
            value={refundDraftFor(order).reason}
            onChange={(e) => updateRefundDraft(order, { reason: e.target.value })}
            sx={{ flex: 1 }}
          />
          <Button
            size={compact ? 'medium' : 'small'}
            sx={{ minHeight: compact ? 44 : 36 }}
            color="warning"
            variant="outlined"
            disabled={!canRefund(order) || Number(refundDraftFor(order).amount) <= 0 || !refundDraftFor(order).reason.trim()}
            onClick={() => refundOrder(order)}
          >
            Refund
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>All orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
        <TextField
          size="small"
          placeholder="Search order, customer, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { md: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="ALL">All statuses</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label={`All ${orders.length}`}
          color={statusFilter === 'ALL' ? 'primary' : 'default'}
          onClick={() => setStatusFilter('ALL')}
        />
        {STATUSES.map((status) => (
          <Chip
            key={status}
            label={`${status} ${statusCounts[status] || 0}`}
            color={statusFilter === status ? 'primary' : 'default'}
            variant={statusFilter === status ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </Stack>
      {isSmall ? (
        <Stack spacing={1.5}>
          {filteredOrders.map((order) => (
            <Card key={order.id} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Link component={RouterLink} to={`/admin/orders/${order.id}`} fontWeight={800}>Order #{order.id}</Link>
                      <Typography variant="body2" color="text.secondary">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography fontWeight={800}>${Number(order.totalAmount).toFixed(2)}</Typography>
                      <Chip label={order.status} size="small" />
                    </Stack>
                  </Stack>
                  {(order.shippingCarrier || order.trackingNumber) && (
                    <Typography variant="caption" color="text.secondary">
                      {[order.shippingCarrier, order.trackingNumber].filter(Boolean).join(' - ')}
                    </Typography>
                  )}
                  {renderOrderControls(order, true)}
                </Stack>
              </CardContent>
            </Card>
          ))}
          {filteredOrders.length === 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                  No orders match the current filters.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link component={RouterLink} to={`/admin/orders/${order.id}`}>#{order.id}</Link>
                  </TableCell>
                  <TableCell>
                    {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '-'}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip label={order.status} size="small" />
                      {order.shippingCarrier && (
                        <Typography variant="caption" color="text.secondary">{order.shippingCarrier}</Typography>
                      )}
                      {order.trackingNumber && (
                        <Typography variant="caption" color="text.secondary">{order.trackingNumber}</Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{renderOrderControls(order)}</TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No orders match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {pageData.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageData.totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}
    </Box>
  );
}
