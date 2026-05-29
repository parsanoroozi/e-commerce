import { Box, Card, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import PageContainer from '../components/layout/PageContainer';

const STATUS_COLOR = {
  AWAITING_PAYMENT: 'warning',
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'default',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi
      .myOrders()
      .then((data) => setOrders(data.content))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>My orders</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {orders.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">You have no orders yet.</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {orders.map((order) => (
            <Card
              key={order.id}
              component={RouterLink}
              to={`/orders/${order.id}`}
              sx={{
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box>
                <Typography fontWeight={600}>Order #{order.id}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(order.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip label={order.status} size="small" color={STATUS_COLOR[order.status] || 'default'} />
                <Typography variant="h6" color="primary">
                  ${Number(order.totalAmount).toFixed(2)}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </PageContainer>
  );
}
