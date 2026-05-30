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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { showError, showSuccess } from '../../utils/toast';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [threshold, setThreshold] = useState('10');
  const [saving, setSaving] = useState(false);

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
    { label: 'Revenue today', value: `$${Number(data.revenueToday).toFixed(2)}` },
    { label: 'Total revenue', value: `$${Number(data.revenueTotal).toFixed(2)}` },
  ];

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
          <Grid key={s.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" color="primary">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Low stock (≤ {data.lowStockThreshold})
          </Typography>
          <List dense>
            {data.lowStockItems.length === 0 ? (
              <ListItem><ListItemText primary="No low stock products" /></ListItem>
            ) : (
              data.lowStockItems.map((p) => (
                <ListItem key={p.id} divider>
                  <ListItemText primary={p.name} secondary={`${p.stockQuantity} left`} />
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
