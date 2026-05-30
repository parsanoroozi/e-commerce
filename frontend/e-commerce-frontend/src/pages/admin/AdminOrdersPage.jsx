import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputAdornment,
  Link,
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
import SearchIcon from '@mui/icons-material/Search';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { subscribeToApiChanges } from '../../api/client';
import { ordersApi } from '../../api/orders';

const STATUSES = ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(() =>
    ordersApi.adminAll().then((data) => setOrders(data.content)).catch((err) => setError(err.message)), []);

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

  const updateStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

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
                  <Link component={RouterLink} to={`/orders/${order.id}`}>#{order.id}</Link>
                </TableCell>
                <TableCell>
                  {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '-'}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                      {STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
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
    </Box>
  );
}
