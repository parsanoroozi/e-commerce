import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { subscribeToApiChanges } from '../../api/client';
import { cartApi } from '../../api/cart';
import { notificationsApi } from '../../api/notifications';
import { storefrontApi } from '../../api/storefront';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAppActions } from '../../utils/appEvents';
import { resolveImageUrl } from '../../utils/imageUrl';
import EmptyState from '../common/EmptyState';
import ThemeToggle from '../common/ThemeToggle';

const navItems = [
  { to: '/', label: 'Shop', icon: <StorefrontOutlinedIcon />, end: true },
  { to: '/wishlist', label: 'Wishlist', icon: <FavoriteBorderOutlinedIcon />, auth: true },
  { to: '/cart', label: 'Cart', icon: <ShoppingCartOutlinedIcon />, auth: true },
  { to: '/orders', label: 'Orders', icon: <ReceiptLongOutlinedIcon />, auth: true },
  { to: '/admin/dashboard', label: 'Admin', icon: <AdminPanelSettingsOutlinedIcon />, admin: true },
];

const INITIAL_VISIBLE_NOTIFICATIONS = 5;

export default function AppNavbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [notificationLastPage, setNotificationLastPage] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const notificationClearStartedAt = useRef(0);
  const brandName = storeSettings?.brandName || 'ShopVerse';
  const logoUrl = storeSettings?.logoUrl ? resolveImageUrl(storeSettings.logoUrl) : null;

  const refreshCounts = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishCount(0);
      setUnread(0);
      setNotifications([]);
      setNotificationError('');
      setNotificationSettings(null);
      setNotificationSettingsOpen(false);
      return;
    }
    await Promise.all([
      cartApi.summary().then((d) => setCartCount(d.itemCount)).catch(() => {}),
      wishlistApi.count().then((d) => setWishCount(d.count)).catch(() => {}),
      notificationsApi.unreadCount().then((d) => setUnread(d.count)).catch(() => {}),
    ]);
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCounts();
    setDrawerOpen(false);
  }, [isAuthenticated, location.pathname, refreshCounts]);

  useEffect(() => {
    storefrontApi.settings().then(setStoreSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToApiChanges((change) => {
      const resources = change?.resources || [];
      const recentlyClearedNotifications = resources.includes('notifications')
        && resources.length === 1
        && Date.now() - notificationClearStartedAt.current < 2000;
      if (recentlyClearedNotifications) {
        return;
      }
      if (
        resources.includes('cart')
        || resources.includes('wishlist')
        || resources.includes('notifications')
        || resources.includes('orders')
        || resources.includes('auth')
      ) {
        window.setTimeout(refreshCounts, 500);
      }
    });
    return unsubscribe;
  }, [refreshCounts]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const unsubscribe = subscribeToAppActions(({ type, payload = {} }) => {
      switch (type) {
        case 'wishlist:item-added':
          setWishCount((count) => count + 1);
          break;
        case 'wishlist:item-removed':
          setWishCount((count) => Math.max(0, count - 1));
          break;
        case 'cart:item-added':
          setCartCount((count) => Number.isFinite(payload.totalItems)
            ? payload.totalItems
            : count + Number(payload.quantity || 1));
          break;
        case 'cart:item-updated':
        case 'cart:item-removed':
        case 'cart:cleared':
          if (Number.isFinite(payload.totalItems)) {
            setCartCount(payload.totalItems);
          } else {
            refreshCounts();
          }
          break;
        case 'notifications:item-read':
          setUnread((count) => Math.max(0, count - 1));
          break;
        case 'notifications:all-read':
          setUnread(0);
          setNotifications((items) => items.map((item) => ({ ...item, read: true })));
          break;
        case 'notifications:cleared':
          setUnread(0);
          setNotifications([]);
          setNotificationPage(0);
          setNotificationLastPage(true);
          break;
        default:
          break;
      }
    });
    return unsubscribe;
  }, [isAuthenticated, refreshCounts]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let closed = false;
    const source = new EventSource(notificationsApi.streamUrl(), { withCredentials: true });
    source.addEventListener('notification', (event) => {
      if (closed) return;
      try {
        const notification = JSON.parse(event.data);
        setNotifications((items) => [
          notification,
          ...items.filter((item) => item.id !== notification.id),
        ].slice(0, Math.max(INITIAL_VISIBLE_NOTIFICATIONS, items.length)));
        if (!notification.read) {
          setUnread((count) => count + 1);
        }
      } catch {
        refreshCounts();
      }
    });
    source.onerror = () => {
      refreshCounts();
    };
    return () => {
      closed = true;
      source.close();
    };
  }, [isAuthenticated, refreshCounts]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refreshOnFocus = () => {
      if (!document.hidden) refreshCounts();
    };
    window.addEventListener('focus', refreshCounts);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.removeEventListener('focus', refreshCounts);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [isAuthenticated, refreshCounts]);

  const visibleItems = navItems.filter((item) => {
    if (item.admin && !isAdmin) return false;
    if (item.auth && !isAuthenticated) return false;
    return true;
  });

  const loadNotificationsPage = async (page, append = false) => {
    setNotificationLoading(true);
    setNotificationError('');
    try {
      const data = await notificationsApi.list(page, INITIAL_VISIBLE_NOTIFICATIONS);
      setNotifications((items) => append ? [...items, ...(data.content || [])] : (data.content || []));
      setNotificationPage(data.page ?? page);
      setNotificationLastPage(Boolean(data.last));
    } catch (err) {
      setNotificationError(err.message);
    } finally {
      setNotificationLoading(false);
    }
  };

  const openNotifications = async (e) => {
    setNotifAnchor(e.currentTarget);
    await loadNotificationsPage(0, false);
  };

  const loadNotificationSettings = async () => {
    const settings = await notificationsApi.settings();
    setNotificationSettings(settings);
  };

  const toggleNotificationSettings = async () => {
    const nextOpen = !notificationSettingsOpen;
    setNotificationSettingsOpen(nextOpen);
    if (nextOpen && !notificationSettings) {
      await loadNotificationSettings();
    }
  };

  const updateNotificationSetting = async (key, checked) => {
    const optimistic = {
      ...(notificationSettings || {}),
      [key]: checked,
    };
    setNotificationSettings(optimistic);
    const saved = await notificationsApi.updateSettings({ [key]: checked });
    setNotificationSettings(saved);
  };

  const openNotificationTarget = async (notification) => {
    if (!notification.read) {
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      await notificationsApi.markRead(notification.id);
    }
    setNotifAnchor(null);
    const targetUrl = notification.targetUrl
      || (notification.relatedOrderId ? `/orders/${notification.relatedOrderId}` : null)
      || (notification.relatedProductId ? `/products/${notification.relatedProductId}` : null);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const markAllRead = async () => {
    notificationClearStartedAt.current = Date.now();
    setUnread(0);
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    await notificationsApi.markAllRead();
    setUnread(0);
    await loadNotificationsPage(0, false);
  };

  const clearNotifications = async () => {
    notificationClearStartedAt.current = Date.now();
    setUnread(0);
    setNotifications([]);
    setNotificationPage(0);
    setNotificationLastPage(true);
    await notificationsApi.clear();
  };

  const showMoreNotifications = () => {
    if (!notificationLoading && !notificationLastPage) {
      loadNotificationsPage(notificationPage + 1, true);
    }
  };

  const showLessNotifications = () => {
    loadNotificationsPage(0, false);
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
        {brandName}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              fontFamily: '"Instrument Serif", serif',
              color: 'text.primary',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 3 },
            }}
          >
            {logoUrl && (
              <Box
                component="img"
                src={logoUrl}
                alt={`${brandName} logo`}
                sx={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 1 }}
              />
            )}
            {brandName}
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
                <Menu
                  anchorEl={notifAnchor}
                  open={Boolean(notifAnchor)}
                  onClose={() => setNotifAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        width: 360,
                        maxWidth: 'calc(100vw - 24px)',
                        maxHeight: 480,
                        overflow: 'hidden',
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">Notifications</Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" startIcon={<SettingsOutlinedIcon />} onClick={toggleNotificationSettings}>
                        Settings
                      </Button>
                      {notifications.length > 0 && (
                        <Button size="small" color="error" startIcon={<DeleteSweepOutlinedIcon />} onClick={clearNotifications}>
                          Clear
                        </Button>
                      )}
                      {unread > 0 && (
                        <Button size="small" onClick={markAllRead}>Mark all read</Button>
                      )}
                    </Stack>
                  </Box>
                  {notificationSettingsOpen && (
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Stack spacing={0.25}>
                        <FormControlLabel
                          control={(
                            <Switch
                              size="small"
                              checked={notificationSettings?.orderNotificationsEnabled ?? true}
                              onChange={(e) => updateNotificationSetting('orderNotificationsEnabled', e.target.checked)}
                            />
                          )}
                          label={<Typography variant="body2">Order updates</Typography>}
                        />
                        <FormControlLabel
                          control={(
                            <Switch
                              size="small"
                              checked={notificationSettings?.productNotificationsEnabled ?? true}
                              onChange={(e) => updateNotificationSetting('productNotificationsEnabled', e.target.checked)}
                            />
                          )}
                          label={<Typography variant="body2">Product updates</Typography>}
                        />
                        <FormControlLabel
                          control={(
                            <Switch
                              size="small"
                              checked={notificationSettings?.realtimeNotificationsEnabled ?? true}
                              onChange={(e) => updateNotificationSetting('realtimeNotificationsEnabled', e.target.checked)}
                            />
                          )}
                          label={<Typography variant="body2">Real-time alerts</Typography>}
                        />
                      </Stack>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  )}
                  {notificationError ? (
                    <Box sx={{ px: 1.5, pb: 1.5 }}>
                      <EmptyState
                        severity="error"
                        icon={<NotificationsOutlinedIcon />}
                        title="Notifications could not load"
                        message={notificationError}
                        onRetry={() => loadNotificationsPage(0, false)}
                      />
                    </Box>
                  ) : notifications.length === 0 ? (
                    <Box sx={{ px: 1.5, pb: 1.5 }}>
                      <EmptyState
                        icon={<NotificationsOutlinedIcon />}
                        title="No notifications"
                        message="Order and product updates will appear here as they happen."
                      />
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                      {notifications.map((n) => (
                        <MenuItem
                          key={n.id}
                          onClick={() => openNotificationTarget(n)}
                          sx={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            whiteSpace: 'normal',
                            gap: 0.25,
                            minHeight: 64,
                            bgcolor: n.read ? 'transparent' : 'action.hover',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                            <Typography variant="body2" fontWeight={n.read ? 500 : 800}>{n.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {formatNotificationTime(n.createdAt)}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                        </MenuItem>
                      ))}
                      {!notificationLastPage && (
                        <Box sx={{ px: 1, py: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            fullWidth
                            disabled={notificationLoading}
                            onClick={showMoreNotifications}
                          >
                            {notificationLoading ? 'Loading...' : 'Show more'}
                          </Button>
                        </Box>
                      )}
                      {notifications.length > INITIAL_VISIBLE_NOTIFICATIONS && (
                        <Box sx={{ px: 1, pb: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            fullWidth
                            disabled={notificationLoading}
                            onClick={showLessNotifications}
                          >
                            Show less
                          </Button>
                        </Box>
                      )}
                    </Box>
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

function formatNotificationTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
