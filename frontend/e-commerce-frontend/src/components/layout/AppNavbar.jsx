import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { cartApi } from '../../api/cart';
import { notificationsApi } from '../../api/notifications';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const navItems = [
  { to: '/', label: 'Shop', icon: <StorefrontOutlinedIcon />, end: true },
  { to: '/wishlist', label: 'Wishlist', icon: <FavoriteBorderOutlinedIcon />, auth: true },
  { to: '/cart', label: 'Cart', icon: <ShoppingCartOutlinedIcon />, auth: true },
  { to: '/orders', label: 'Orders', icon: <ReceiptLongOutlinedIcon />, auth: true },
  { to: '/admin/dashboard', label: 'Admin', icon: <AdminPanelSettingsOutlinedIcon />, admin: true },
];

export default function AppNavbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const refreshCounts = () => {
    if (!isAuthenticated) return;
    cartApi.summary().then((d) => setCartCount(d.itemCount)).catch(() => {});
    wishlistApi.count().then((d) => setWishCount(d.count)).catch(() => {});
    notificationsApi.unreadCount().then((d) => setUnread(d.count)).catch(() => {});
  };

  useEffect(() => {
    refreshCounts();
    setDrawerOpen(false);
  }, [isAuthenticated, location.pathname]);

  const visibleItems = navItems.filter((item) => {
    if (item.admin && !isAdmin) return false;
    if (item.auth && !isAuthenticated) return false;
    return true;
  });

  const openNotifications = async (e) => {
    setNotifAnchor(e.currentTarget);
    const list = await notificationsApi.list();
    setNotifications(list);
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnread(0);
    setNotifications(await notificationsApi.list());
  };

  const badgeFor = (to) => {
    if (to === '/cart') return cartCount;
    if (to === '/wishlist') return wishCount;
    return 0;
  };

  const isActive = (item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

  const navLink = (item, onClick) => {
    const count = badgeFor(item.to);
    const active = isActive(item);

    return (
      <ListItemButton
        key={item.to}
        component={RouterLink}
        to={item.to}
        selected={active}
        onClick={onClick}
        sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
      >
        {item.icon && <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
        {count > 0 && (
          <Badge badgeContent={count} color="primary" sx={{ mr: 1 }} />
        )}
      </ListItemButton>
    );
  };

  const drawer = (
    <Box sx={{ width: 280, pt: 1 }} role="navigation">
      <Typography variant="h6" sx={{ px: 2, py: 1.5, fontFamily: '"Instrument Serif", serif' }}>
        ShopVerse
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <List>{visibleItems.map((item) => navLink(item, () => setDrawerOpen(false)))}</List>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 2, pb: 2 }}>
        {isAuthenticated ? (
          <Stack spacing={1}>
            <Button component={RouterLink} to="/profile" variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>
              Profile
            </Button>
            <Button variant="outlined" color="inherit" fullWidth onClick={() => { logout(); setDrawerOpen(false); }}>
              Logout
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Button component={RouterLink} to="/login" variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>
              Login
            </Button>
            <Button component={RouterLink} to="/register" variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>
              Register
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" color="default" enableColorOnDark elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: { xs: 'wrap', md: 'nowrap' }, minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{
              fontFamily: '"Instrument Serif", serif',
              color: 'text.primary',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 3 },
            }}
          >
            ShopVerse
          </Typography>

          {!isMobile && (
            <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
              {visibleItems.map((item) => {
                const count = badgeFor(item.to);
                const active = isActive(item);
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color={active ? 'primary' : 'inherit'}
                    startIcon={
                      count > 0 && item.to === '/cart' ? (
                        <Badge badgeContent={count} color="primary">
                          {item.icon}
                        </Badge>
                      ) : count > 0 && item.to === '/wishlist' ? (
                        <Badge badgeContent={count} color="primary">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )
                    }
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>
          )}

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 'auto' }}>
            <ThemeToggle />
            {isAuthenticated && (
              <>
                <IconButton color="inherit" onClick={openNotifications} aria-label="Notifications">
                  <Badge badgeContent={unread} color="error">
                    <NotificationsOutlinedIcon />
                  </Badge>
                </IconButton>
                <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}>
                  <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 280 }}>
                    <Typography variant="subtitle2">Notifications</Typography>
                    {unread > 0 && (
                      <Button size="small" onClick={markAllRead}>Mark all read</Button>
                    )}
                  </Box>
                  {notifications.length === 0 ? (
                    <MenuItem disabled>No notifications</MenuItem>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <MenuItem key={n.id} onClick={() => setNotifAnchor(null)} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight={n.read ? 400 : 700}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                      </MenuItem>
                    ))
                  )}
                </Menu>
                {!isMobile && (
                  <Button component={RouterLink} to="/profile" color="inherit" size="small">
                    Hi, {user?.firstName}
                  </Button>
                )}
                {!isMobile && (
                  <Button color="inherit" size="small" onClick={logout}>Logout</Button>
                )}
              </>
            )}
            {!isAuthenticated && !isMobile && (
              <>
                <Button component={RouterLink} to="/login" color="inherit">Login</Button>
                <Button component={RouterLink} to="/register" variant="contained">Register</Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} ModalProps={{ keepMounted: true }}>
        {drawer}
      </Drawer>
    </>
  );
}
