import { Tab, Tabs, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';

const tabs = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/categories', label: 'Categories' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/coupons', label: 'Coupons' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? false;

  return (
    <PageContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin panel
      </Typography>
      <Tabs
        value={current}
        onChange={(_, v) => navigate(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((t) => (
          <Tab key={t.path} label={t.label} value={t.path} />
        ))}
      </Tabs>
      <Outlet />
    </PageContainer>
  );
}
