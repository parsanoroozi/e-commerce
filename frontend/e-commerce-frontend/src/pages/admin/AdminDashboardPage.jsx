import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
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

function BarList({ data, valueKey = 'revenue', formatValue = money }) {
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
              <Box sx={{ height: '100%', width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`, bgcolor: 'primary.main' }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
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
            Products at or below this stock level appear in the low-stock list below.
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
                <BarList data={revenueSeries} valueKey="orderCount" formatValue={(value) => `${value} orders`} />
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
                      <Typography variant="body2" fontWeight={700}>{step.count} · {Number(step.rate).toFixed(1)}%</Typography>
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
              <List dense disablePadding>
                {(data.bestSellingProducts || []).length === 0 ? (
                  <ListItem><ListItemText primary="No sales yet" /></ListItem>
                ) : data.bestSellingProducts.map((product) => (
                  <ListItem key={product.productId} divider>
                    <ListItemText
                      primary={product.productName}
                      secondary={`${product.unitsSold} sold · ${money(product.revenue)}${product.sku ? ` · ${product.sku}` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Low-stock / high-demand</Typography>
              <List dense disablePadding>
                {(data.lowStockHighDemandProducts || []).length === 0 ? (
                  <ListItem><ListItemText primary="No high-demand low-stock products" /></ListItem>
                ) : data.lowStockHighDemandProducts.map((product) => (
                  <ListItem key={product.productId} divider>
                    <ListItemText
                      primary={product.productName}
                      secondary={`${product.stockQuantity} left · ${product.unitsSold} sold`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>New customers</Typography>
              <BarList data={data.newCustomersByDay || []} valueKey="customerCount" formatValue={(value) => `${value} customers`} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Low stock (&lt;= {data.lowStockThreshold})
          </Typography>
          <List dense>
            {data.lowStockItems.length === 0 ? (
              <ListItem><ListItemText primary="No low stock products" /></ListItem>
            ) : (
              data.lowStockItems.map((p) => (
                <ListItem
                  key={p.id}
                  divider
                  secondaryAction={<Button size="small" variant="outlined" onClick={() => quickRestock(p)}>+10</Button>}
                >
                  <ListItemText
                    primary={p.name}
                    secondary={`${p.stockQuantity} left${p.variants?.length ? ' across variants' : ''}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>Recent orders</Typography>
          <List dense>
            {data.recentOrders.map((o) => (
              <ListItem key={o.id} divider>
                <ListItemText
                  primary={<Link component={RouterLink} to={`/orders/${o.id}`}>#{o.id}</Link>}
                  secondary={`${o.status} — $${Number(o.totalAmount).toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );
}
