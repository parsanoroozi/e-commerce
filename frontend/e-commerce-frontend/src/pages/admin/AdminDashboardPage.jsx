import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { showError, showSuccess } from '../../utils/toast';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function BarList({ data, valueKey = 'revenue', formatValue = money, color = 'primary.main' }) {
  const max = Math.max(...(data || []).map((point) => Number(point[valueKey] || 0)), 1);
  return (
    <Stack spacing={1}>
      {(data || []).map((point) => {
        const value = Number(point[valueKey] || 0);
        return (
          <Box key={point.label}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="caption" color="text.secondary">{point.label}</Typography>
              <Typography variant="caption" fontWeight={700}>{formatValue(value)}</Typography>
            </Stack>
            <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`, bgcolor: color }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function RankedBars({ data, valueKey, labelKey, formatValue, color = 'primary.main', emptyText = 'No data yet' }) {
  const values = data || [];
  const max = Math.max(...values.map((item) => Number(item[valueKey] || 0)), 1);
  if (values.length === 0) return <Typography color="text.secondary">{emptyText}</Typography>;
  return (
    <Stack spacing={1.5}>
      {values.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        return (
          <Box key={`${item[labelKey]}-${index}`}>
            <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="baseline">
              <Typography variant="body2" fontWeight={700} noWrap>{item[labelKey]}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatValue(item)}</Typography>
            </Stack>
            <Box sx={{ mt: 0.5, height: 12, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`, bgcolor: color, borderRadius: 10 }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function LowStockVisual({ items, threshold, onRestock }) {
  const values = items || [];
  if (values.length === 0) return <Typography color="text.secondary">No low stock products</Typography>;
  return (
    <Stack spacing={1.5}>
      {values.map((product) => {
        const stock = Number(product.stockQuantity || 0);
        const fill = Math.min((stock / Math.max(threshold, 1)) * 100, 100);
        return (
          <Box key={product.id}>
            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{product.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stock} left{product.variants?.length ? ' across variants' : ''}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={() => onRestock(product)}>+10</Button>
            </Stack>
            <Box sx={{ mt: 0.75, height: 12, bgcolor: 'error.main', borderRadius: 10, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${fill}%`, bgcolor: stock <= 3 ? 'warning.main' : 'success.main' }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function RecentOrderFlow({ orders }) {
  const values = orders || [];
  if (values.length === 0) return <Typography color="text.secondary">No recent orders</Typography>;
  return (
    <Stack spacing={1.25}>
      {values.map((order) => (
        <Box key={order.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
            <Button component={RouterLink} to={`/admin/orders/${order.id}`} size="small">#{order.id}</Button>
            <Typography variant="caption" color="text.secondary">{order.status}</Typography>
            <Typography variant="body2" fontWeight={800}>${Number(order.totalAmount).toFixed(2)}</Typography>
          </Stack>
          <Box sx={{ mt: 0.75, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${statusProgress(order.status)}%`, bgcolor: 'secondary.main' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function statusProgress(status) {
  return {
    AWAITING_PAYMENT: 12,
    PENDING: 22,
    CONFIRMED: 40,
    PACKED: 58,
    SHIPPED: 76,
    DELIVERED: 100,
    CANCELLED: 100,
    REFUNDED: 100,
  }[status] || 30;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [threshold, setThreshold] = useState('10');
  const [saving, setSaving] = useState(false);
  const [revenueRange, setRevenueRange] = useState('day');

  const load = () => adminApi.dashboard().then((d) => {
    setData(d);
    setThreshold(String(d.lowStockThreshold ?? 10));
  });

  useEffect(() => {
    load().catch((err) => showError(err.message));
  }, []);

  const saveThreshold = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateLowStockThreshold(Number(threshold));
      setThreshold(String(updated.lowStockThreshold));
      showSuccess('Low stock threshold updated');
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const quickRestock = async (product) => {
    const variant = product.variants?.find((v) => v.active && v.stockQuantity <= data.lowStockThreshold);
    try {
      await adminApi.adjustInventory({
        productId: product.id,
        variantId: variant?.id || null,
        quantityDelta: 10,
        reason: 'Quick restock from low-stock dashboard',
      });
      showSuccess('Stock increased by 10');
      await load();
    } catch (err) {
      showError(err.message);
    }
  };

  if (!data) {
    return (
      <Grid container justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Grid>
    );
  }

  const stats = [
    { label: 'Total orders', value: data.totalOrders },
    { label: 'Pending', value: data.pendingOrders },
    { label: 'Low stock', value: data.lowStockProducts },
    { label: 'Revenue today', value: money(data.revenueToday) },
    { label: 'Total revenue', value: money(data.revenueTotal) },
    { label: 'Avg order value', value: money(data.averageOrderValue) },
  ];

  const revenueSeries = revenueRange === 'week'
    ? data.revenueByWeek
    : revenueRange === 'month'
      ? data.revenueByMonth
      : data.revenueByDay;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Inventory alerts</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Products at or below this stock level appear in the low-stock visual below.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
            <TextField
              label="Low stock threshold"
              type="number"
              size="small"
              inputProps={{ min: 1, max: 10000 }}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <Button variant="contained" onClick={saveThreshold} disabled={saving}>
              {saving ? 'Saving...' : 'Save threshold'}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Current threshold: <strong>{data.lowStockThreshold}</strong> units
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" color="primary">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Revenue and orders</Typography>
                  <Typography variant="body2" color="text.secondary">Net revenue after refunds with order-count trend.</Typography>
                </Box>
                <Select size="small" value={revenueRange} onChange={(e) => setRevenueRange(e.target.value)} sx={{ minWidth: 140 }}>
                  <MenuItem value="day">Daily</MenuItem>
                  <MenuItem value="week">Weekly</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                </Select>
              </Stack>
              <BarList data={revenueSeries} />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Order count trend</Typography>
                <BarList data={revenueSeries} valueKey="orderCount" color="secondary.main" formatValue={(value) => `${value} orders`} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Conversion funnel</Typography>
              <Stack spacing={1.25}>
                {(data.conversionFunnel || []).map((step) => (
                  <Box key={step.label}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">{step.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>{step.count} / {Number(step.rate).toFixed(1)}%</Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${Math.min(Number(step.rate || 0), 100)}%`, bgcolor: 'secondary.main' }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Best-selling products</Typography>
              <RankedBars
                data={data.bestSellingProducts || []}
                valueKey="unitsSold"
                labelKey="productName"
                formatValue={(product) => `${product.unitsSold} sold / ${money(product.revenue)}`}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Low-stock / high-demand</Typography>
              <RankedBars
                data={data.lowStockHighDemandProducts || []}
                valueKey="unitsSold"
                labelKey="productName"
                color="warning.main"
                emptyText="No high-demand low-stock products"
                formatValue={(product) => `${product.stockQuantity} left / ${product.unitsSold} sold`}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>New customers</Typography>
              <BarList data={data.newCustomersByDay || []} valueKey="customerCount" color="success.main" formatValue={(value) => `${value} customers`} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low stock (&lt;= {data.lowStockThreshold})
              </Typography>
              <LowStockVisual items={data.lowStockItems} threshold={data.lowStockThreshold} onRestock={quickRestock} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent order flow</Typography>
              <RecentOrderFlow orders={data.recentOrders} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
