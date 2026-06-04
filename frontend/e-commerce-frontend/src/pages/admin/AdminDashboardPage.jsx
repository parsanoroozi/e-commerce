import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  Typography,
} from '@mui/material';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { showError, showSuccess } from '../../utils/toast';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function shortMoney(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return money(amount);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function maxOf(data, key) {
  return Math.max(...(data || []).map((item) => Number(item[key] || 0)), 1);
}

function sumOf(data, key) {
  return (data || []).reduce((sum, item) => sum + Number(item[key] || 0), 0);
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

function ChartCard({ title, subtitle, action, children, sx }) {
  return (
    <Card
      className="luxury-scroll-card"
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
          </Box>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function MiniBars({ data, keyName, color = 'primary.main' }) {
  const values = data || [];
  const max = maxOf(values, keyName);
  return (
    <Stack direction="row" alignItems="end" spacing={0.5} sx={{ height: 42, mt: 1 }}>
      {values.slice(-10).map((point, index) => {
        const value = Number(point[keyName] || 0);
        return (
          <Box
            key={`${point.label}-${index}`}
            title={`${point.label}: ${value}`}
            sx={{
              flex: 1,
              minWidth: 4,
              height: `${Math.max((value / max) * 100, value > 0 ? 8 : 3)}%`,
              bgcolor: color,
              opacity: 0.36 + (index / Math.max(values.length, 1)) * 0.64,
              transition: 'height 300ms ease, opacity 300ms ease',
            }}
          />
        );
      })}
    </Stack>
  );
}

function MetricCard({ icon, label, value, helper, series, seriesKey, color = 'primary.main', highlight = false }) {
  return (
    <Card
      className="luxury-scroll-card"
      sx={{
        height: '100%',
        bgcolor: (t) => highlight
          ? (t.palette.mode === 'dark' ? 'rgba(255,122,0,0.16)' : '#ffe9d2')
          : 'background.paper',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>{label}</Typography>
            <Typography variant="h4" color={color} sx={{ lineHeight: 1.08 }}>{value}</Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              color,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {icon}
          </Box>
        </Stack>
        {series && <MiniBars data={series} keyName={seriesKey} color={color} />}
        {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
      </CardContent>
    </Card>
  );
}

function RevenueOrdersChart({ data }) {
  const values = data || [];
  const maxRevenue = maxOf(values, 'revenue');
  const maxOrders = maxOf(values, 'orderCount');
  if (values.length === 0) return <Typography color="text.secondary">No revenue data yet.</Typography>;
  const totalRevenue = sumOf(values, 'revenue');
  const totalOrders = sumOf(values, 'orderCount');
  const chartWidth = 720;
  const chartHeight = 260;
  const padX = 34;
  const padY = 24;
  const xFor = (index) => values.length === 1
    ? chartWidth / 2
    : padX + (index / (values.length - 1)) * (chartWidth - padX * 2);
  const yFor = (value, max) => chartHeight - padY - (Number(value || 0) / Math.max(max, 1)) * (chartHeight - padY * 2);
  const revenuePoints = values.map((point, index) => `${xFor(index)},${yFor(point.revenue, maxRevenue)}`).join(' ');
  const orderPoints = values.map((point, index) => `${xFor(index)},${yFor(point.orderCount, maxOrders)}`).join(' ');
  const marker = values[Math.floor(values.length / 2)] || values[0];
  const markerIndex = values.indexOf(marker);
  const markerX = xFor(markerIndex);
  const markerY = yFor(marker?.revenue, maxRevenue);

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">Revenue in view</Typography>
            <Typography variant="h6" color="primary.main">{shortMoney(totalRevenue)}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">Orders in view</Typography>
            <Typography variant="h6" color="secondary.main">{formatNumber(totalOrders)}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">Peak revenue</Typography>
            <Typography variant="h6">{shortMoney(maxRevenue)}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">Peak orders</Typography>
            <Typography variant="h6">{formatNumber(maxOrders)}</Typography>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box
          component="svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Revenue and orders line chart"
          sx={{ display: 'block', width: '100%', height: { xs: 240, md: 280 } }}
        >
          {[0, 1, 2, 3, 4].map((line) => {
            const y = padY + line * ((chartHeight - padY * 2) / 4);
            return (
              <line key={line} x1={padX} x2={chartWidth - padX} y1={y} y2={y} stroke="#e7e7e7" strokeDasharray="7 7" />
            );
          })}
          <polyline points={orderPoints} fill="none" stroke="#ffb36b" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={revenuePoints} fill="none" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((point, index) => (
            <circle key={`${point.label}-dot`} cx={xFor(index)} cy={yFor(point.revenue, maxRevenue)} r="4" fill="#ffffff" stroke="#ff7a00" strokeWidth="3" />
          ))}
          {marker && (
            <>
              <rect x={markerX - 36} y={Math.max(markerY - 56, 8)} width="72" height="38" rx="8" fill="#ffffff" stroke="#eeeeee" />
              <text x={markerX} y={Math.max(markerY - 38, 26)} textAnchor="middle" fontSize="10" fill="#777777">Revenue</text>
              <text x={markerX} y={Math.max(markerY - 22, 42)} textAnchor="middle" fontSize="13" fontWeight="800" fill="#171717">{shortMoney(marker.revenue)}</text>
            </>
          )}
        </Box>
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 16, height: 3, bgcolor: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">Revenue</Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 16, height: 3, borderTop: '3px dashed #ffb36b' }} />
          <Typography variant="caption" color="text.secondary">Orders</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, overflow: 'hidden' }}>
        {values.map((point, index) => (
          <Typography
            key={`${point.label}-label-${index}`}
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, textAlign: 'center', display: { xs: index % 2 ? 'none' : 'block', md: 'block' } }}
          >
            {point.label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function DonutChart({ items, valueKey = 'count', labelKey = 'label', colors = ['#ff7a00', '#ffad60', '#ffc78d', '#ffdfbd', '#ffe9d2'] }) {
  const values = items || [];
  const total = values.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  let cursor = 0;
  const stops = values.map((item, index) => {
    const value = Number(item[valueKey] || 0);
    const start = cursor;
    const end = total > 0 ? cursor + (value / total) * 100 : cursor;
    cursor = end;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });
  const background = total > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#f0f0f0, #f0f0f0)';

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          width: 178,
          height: 178,
          mx: 'auto',
          borderRadius: '50%',
          background,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)',
          position: 'relative',
          flex: '0 0 auto',
          display: 'grid',
          placeItems: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 42,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.7)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ lineHeight: 1 }}>
            {formatNumber(total)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            total
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack spacing={1}>
          {values.map((item, index) => (
            <Stack key={`${item[labelKey]}-${index}`} direction="row" justifyContent="space-between" spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: colors[index % colors.length], flex: '0 0 auto' }} />
                <Typography variant="body2" noWrap>{item[labelKey]}</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: 'nowrap' }}>
                {formatNumber(item[valueKey])}
                {total > 0 && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    {Math.round((Number(item[valueKey] || 0) / total) * 100)}%
                  </Typography>
                )}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function CustomerTrendChart({ data }) {
  const values = data || [];
  const maxCustomers = maxOf(values, 'customerCount');
  if (values.length === 0) return <Typography color="text.secondary">No new customer data yet.</Typography>;

  return (
    <Stack direction="row" alignItems="end" spacing={1} sx={{ height: 220, pt: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      {values.map((point, index) => {
        const count = Number(point.customerCount || 0);
        const height = Math.max((count / maxCustomers) * 100, count > 0 ? 10 : 2);
        return (
          <Stack key={`${point.label}-${index}`} alignItems="center" justifyContent="end" sx={{ flex: 1, height: '100%', minWidth: 18 }}>
            <Typography variant="caption" color={count > 0 ? 'primary.main' : 'text.secondary'} fontWeight={900}>
              {count}
            </Typography>
            <Box sx={{ width: 2, height: `${height}%`, bgcolor: count > 0 ? 'primary.main' : 'action.hover', opacity: 0.9 }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: count > 0 ? 'primary.main' : 'action.hover', boxShadow: count > 0 ? '0 0 22px rgba(255,122,0,0.22)' : 'none' }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: { xs: index % 2 ? 'none' : 'block', sm: 'block' } }}>
              {point.label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

function ProductLeaderboard({ data, emptyText = 'No product sales yet.', showStock = false }) {
  const values = data || [];
  const maxUnits = maxOf(values, 'unitsSold');
  if (values.length === 0) return <Typography color="text.secondary">{emptyText}</Typography>;

  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell align="right">Sold</TableCell>
            <TableCell align="right">{showStock ? 'Stock' : 'Revenue'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map((product, index) => (
            <TableRow key={`${product.productId}-${index}`}>
              <TableCell sx={{ minWidth: 180 }}>
                <Typography variant="body2" fontWeight={900}>{product.productName}</Typography>
                <Box sx={{ mt: 0.75, height: 8, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.max((Number(product.unitsSold || 0) / maxUnits) * 100, 4)}%`, height: '100%', bgcolor: 'primary.main' }} />
                </Box>
              </TableCell>
              <TableCell align="right">{formatNumber(product.unitsSold)}</TableCell>
              <TableCell align="right">{showStock ? `${formatNumber(product.stockQuantity)} left` : money(product.revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StockRiskGrid({ items, onRestock }) {
  const values = items || [];
  if (values.length === 0) return <Typography color="text.secondary">No low stock products.</Typography>;
  return (
    <Grid container spacing={1.5}>
      {values.map((product) => {
        const stock = Number(product.stockQuantity || 0);
        const threshold = Number(product.categoryLowStockThreshold || 1);
        const fill = Math.min((stock / Math.max(threshold, 1)) * 100, 100);
        return (
          <Grid key={product.id} size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={900} noWrap>{product.name}</Typography>
                  <Typography variant="caption" color={stock <= 3 ? 'error.main' : 'text.secondary'}>
                    {stock} left / threshold {threshold}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => onRestock(product)}>+10</Button>
              </Stack>
              <Box sx={{ mt: 1, height: 11, bgcolor: 'action.hover', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${fill}%`, bgcolor: stock <= 3 ? 'error.main' : 'warning.main' }} />
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}

function RecentOrderFlow({ orders }) {
  const values = orders || [];
  if (values.length === 0) return <Typography color="text.secondary">No recent orders.</Typography>;
  return (
    <Stack spacing={1}>
      {values.map((order) => (
        <Box key={order.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
            <Button component={RouterLink} to={`/admin/orders/${order.id}`} size="small">#{order.id}</Button>
            <Chip size="small" label={order.status} color={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'default'} />
            <Typography variant="body2" fontWeight={900}>{money(order.totalAmount)}</Typography>
          </Stack>
          <Box sx={{ mt: 1, height: 8, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${statusProgress(order.status)}%`, bgcolor: 'secondary.main' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [revenueRange, setRevenueRange] = useState('day');

  const load = () => adminApi.dashboard().then((d) => {
    setData(d);
  });

  useEffect(() => {
    load().catch((err) => showError(err.message));
  }, []);

  const quickRestock = async (product) => {
    const threshold = Number(product.categoryLowStockThreshold || 0);
    const variant = product.variants?.find((v) => v.active && v.stockQuantity <= threshold);
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

  const revenueSeries = useMemo(() => {
    if (!data) return [];
    if (revenueRange === 'week') return data.revenueByWeek || [];
    if (revenueRange === 'month') return data.revenueByMonth || [];
    return data.revenueByDay || [];
  }, [data, revenueRange]);

  if (!data) {
    return (
      <Grid container justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Grid>
    );
  }

  const orderStatusDonut = (data.conversionFunnel || []).map((step) => ({
    label: step.label.replace(' orders', ''),
    count: step.count,
  }));
  const newCustomersTotal = sumOf(data.newCustomersByDay, 'customerCount');
  const actionableOrders = (data.recentOrders || []).filter((order) => (
    ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'PACKED'].includes(order.status)
  )).length;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<TrendingUpOutlinedIcon />} label="Total sales" value={shortMoney(data.revenueTotal)} helper={`${shortMoney(data.revenueToday)} today`} series={revenueSeries} seriesKey="revenue" highlight />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<ReceiptLongOutlinedIcon />} label="Total orders" value={formatNumber(data.totalOrders)} helper={`${formatNumber(data.pendingOrders)} pending`} series={revenueSeries} seriesKey="orderCount" color="primary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<GroupOutlinedIcon />} label="New customers" value={formatNumber(newCustomersTotal)} helper="Recent customer intake" series={data.newCustomersByDay} seriesKey="customerCount" color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<AutoGraphOutlinedIcon />} label="Average order" value={shortMoney(data.averageOrderValue)} helper="AOV from paid orders" series={revenueSeries} seriesKey="revenue" color="primary.light" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<WarningAmberOutlinedIcon />} label="Low stock" value={formatNumber(data.lowStockProducts)} helper="Using category thresholds" color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 2 }}>
          <MetricCard icon={<Inventory2OutlinedIcon />} label="Top sellers" value={formatNumber((data.bestSellingProducts || []).reduce((sum, item) => sum + Number(item.unitsSold || 0), 0))} helper="Units sold in report" color="primary.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="Revenue and orders"
            subtitle="Gold bars show revenue; emerald bars show order count on the same period."
            action={(
              <Select size="small" value={revenueRange} onChange={(e) => setRevenueRange(e.target.value)} sx={{ minWidth: 140 }}>
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
              </Select>
            )}
          >
            <RevenueOrdersChart data={revenueSeries} />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="Order status mix" subtitle="Share of recent operational states.">
            <DonutChart items={orderStatusDonut} />
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="New customers" subtitle="Lollipop chart by day with visible counts.">
            <CustomerTrendChart data={data.newCustomersByDay || []} />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Best-selling products" subtitle="Ranked visual table by units sold and revenue.">
            <ProductLeaderboard data={data.bestSellingProducts || []} />
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard
            title="Low-stock risk"
            subtitle={`${actionableOrders} recent orders need attention. Alert thresholds are managed per category.`}
          >
            <StockRiskGrid items={data.lowStockItems || []} onRestock={quickRestock} />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <ChartCard title="High-demand low stock" subtitle="Demand signals before the shelf runs dry.">
            <ProductLeaderboard
              data={data.lowStockHighDemandProducts || []}
              emptyText="No high-demand low-stock products."
              showStock
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="Recent order flow" subtitle="Fulfillment progress for the newest orders.">
            <RecentOrderFlow orders={data.recentOrders || []} />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
