import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then(setData);
  }, []);

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
          <Typography variant="h6" gutterBottom>Low stock</Typography>
          <List dense>
            {data.lowStockItems.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText primary={p.name} secondary={`${p.stockQuantity} left`} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>Recent orders</Typography>
          <List dense>
            {data.recentOrders.map((o) => (
              <ListItem key={o.id} divider>
                <ListItemText
                  primary={
                    <Link component={RouterLink} to={`/orders/${o.id}`}>#{o.id}</Link>
                  }
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
