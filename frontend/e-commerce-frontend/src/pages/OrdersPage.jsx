import { Box, Card, Chip, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { subscribeToApiChanges } from '../api/client';
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
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(() => {
    setLoading(true);
    ordersApi
      .myOrders(page)
      .then((data) => {
        setOrders(data.content);
        setPageData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    return subscribeToApiChanges((change) => {
      if (change?.resources?.includes('orders')) {
        loadOrders();
      }
    });
  }, [loadOrders]);

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
    </PageContainer>
  );
}
