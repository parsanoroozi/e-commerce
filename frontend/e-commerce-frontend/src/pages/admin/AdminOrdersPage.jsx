import {
  Alert,
  Box,
  FormControl,
  Link,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ordersApi } from '../../api/orders';

const STATUSES = ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    ordersApi.adminAll().then((data) => setOrders(data.content)).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>All orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
            {orders.map((order) => (
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
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
