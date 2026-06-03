import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { path: '/admin/orders', label: 'Orders', icon: <ReceiptLongOutlinedIcon /> },
  { path: '/admin/products', label: 'Products', icon: <Inventory2OutlinedIcon /> },
  { path: '/admin/categories', label: 'Categories', icon: <CategoryOutlinedIcon /> },
  { path: '/admin/users', label: 'Customers', icon: <PeopleOutlinedIcon /> },
  { path: '/admin/reports', label: 'Reports', icon: <AssessmentOutlinedIcon /> },
  { path: '/admin/coupons', label: 'Discounts', icon: <ConfirmationNumberOutlinedIcon /> },
  { path: '/admin/settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
  { path: '/admin/audit-logs', label: 'Audit logs', icon: <StorefrontOutlinedIcon /> },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? '/admin/dashboard';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '260px 1fr' },
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 2,
          minHeight: '100vh',
          p: 3,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
              '& span': { bgcolor: 'primary.main', borderRadius: '4px' },
            }}
          >
            <Box component="span" />
            <Box component="span" />
            <Box component="span" />
            <Box component="span" />
          </Box>
          <Typography variant="h5">ShopVerse</Typography>
        </Stack>

        <Stack spacing={0.75}>
          {tabs.slice(0, 7).map((tab) => (
            <SidebarItem
              key={tab.path}
              active={current === tab.path}
              icon={tab.icon}
              label={tab.label}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </Stack>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1 }} />

        <Stack spacing={0.75}>
          {tabs.slice(7).map((tab) => (
            <SidebarItem
              key={tab.path}
              active={current === tab.path}
              icon={tab.icon}
              label={tab.label}
              onClick={() => navigate(tab.path)}
            />
          ))}
          <SidebarItem icon={<StorefrontOutlinedIcon />} label="Shop" onClick={() => navigate('/')} />
          <SidebarItem icon={<HelpOutlineOutlinedIcon />} label="Help" onClick={() => navigate('/contact')} />
        </Stack>
      </Box>

      <Box sx={{ minWidth: 0, p: { xs: 2, md: 3.5 }, bgcolor: 'background.default' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h3" component="h1" sx={{ lineHeight: 1 }}>
              {tabs.find((tab) => tab.path === current)?.label || 'Dashboard'}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              size="small"
              placeholder="Search stock, order, etc"
              sx={{ width: { xs: '100%', md: 340 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<StorefrontOutlinedIcon />}
              onClick={() => navigate('/')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Shop
            </Button>
            <ThemeToggle />
            <IconButton aria-label="Messages" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <MoreHorizOutlinedIcon />
            </IconButton>
            <IconButton aria-label="Notifications" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <Badge color="error" variant="dot">
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 180, display: { xs: 'none', md: 'flex' } }}>
              <Avatar sx={{ width: 42, height: 42, bgcolor: 'primary.light', color: 'primary.dark' }}>
                {(user?.firstName?.[0] || 'A').toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin user'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Admin</Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: { xs: 'flex', lg: 'none' },
            overflowX: 'auto',
            pb: 1.5,
            mb: 2,
          }}
        >
          {[...tabs, { path: '/', label: 'Shop', icon: <StorefrontOutlinedIcon /> }].map((tab) => (
            <Button
              key={tab.path}
              variant={current === tab.path ? 'contained' : 'outlined'}
              startIcon={tab.icon}
              onClick={() => navigate(tab.path)}
              sx={{ flexShrink: 0 }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        <Outlet />
      </Box>
    </Box>
  );
}

function SidebarItem({ active = false, icon, label, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: '100%',
        minHeight: 48,
        px: 2,
        border: 0,
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        textAlign: 'left',
        color: active ? '#ffffff' : 'text.secondary',
        bgcolor: active ? 'primary.main' : 'transparent',
        font: 'inherit',
        fontWeight: active ? 800 : 700,
        transition: 'background-color 160ms ease, color 160ms ease',
        '& svg': { fontSize: 22 },
        '&:hover': {
          bgcolor: active ? 'primary.main' : 'warning.light',
          color: active ? '#ffffff' : 'text.primary',
        },
      }}
    >
      {icon}
      <Typography variant="body1" fontWeight="inherit">{label}</Typography>
    </Box>
  );
}
