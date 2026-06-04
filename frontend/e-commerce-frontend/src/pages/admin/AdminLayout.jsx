import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminGlobalSearch from '../../components/admin/AdminGlobalSearch';
import { notificationsApi } from '../../api/notifications';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { showError } from '../../utils/toast';

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

const SIDEBAR_STORAGE_KEY = 'shopverse-admin-sidebar-collapsed';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? '/admin/dashboard';

  useEffect(() => {
    notificationsApi.unreadCount().then((d) => setUnread(d.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopCollapsed));
  }, [desktopCollapsed]);

  const openNotifications = async (event) => {
    setNotifAnchor(event.currentTarget);
    try {
      const list = await notificationsApi.list(0, 5);
      setNotifications(list.content || []);
      setUnread((list.content || []).filter((item) => !item.read).length);
    } catch (err) {
      showError(err.message);
    }
  };

  const openNotificationTarget = async (notification) => {
    if (!notification.read) {
      await notificationsApi.markRead(notification.id);
      setUnread((count) => Math.max(0, count - 1));
    }
    setNotifAnchor(null);
    const target = notification.relatedOrderId
      ? `/admin/orders/${notification.relatedOrderId}`
      : notification.relatedProductId
        ? '/admin/products'
        : notification.targetUrl;
    if (target) navigate(target);
  };

  const handleLogout = async () => {
    setProfileAnchor(null);
    await logout();
    navigate('/');
  };

  const goTo = (path) => {
    setNavOpen(false);
    navigate(path);
  };

  const navItems = (collapsed = false) => (
    <>
      <Stack spacing={0.75} sx={{ p: collapsed ? 1.25 : 2 }}>
        {tabs.map((tab) => (
          <SidebarItem
            key={tab.path}
            active={current === tab.path}
            collapsed={collapsed}
            icon={tab.icon}
            label={tab.label}
            onClick={() => goTo(tab.path)}
          />
        ))}
      </Stack>
      <Divider sx={{ mx: collapsed ? 1.5 : 2 }} />
      <Stack spacing={0.75} sx={{ p: collapsed ? 1.25 : 2 }}>
        <SidebarItem collapsed={collapsed} icon={<StorefrontOutlinedIcon />} label="Shop" onClick={() => goTo('/')} />
        <SidebarItem collapsed={collapsed} icon={<HelpOutlineOutlinedIcon />} label="Help" onClick={() => goTo('/contact')} />
      </Stack>
    </>
  );

  const drawer = (
    <Box sx={{ width: 304, maxWidth: '84vw', height: '100%', bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ px: 2.25, py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
              flex: '0 0 auto',
              '& span': { bgcolor: 'primary.main', borderRadius: '4px' },
            }}
          >
            <Box component="span" />
            <Box component="span" />
            <Box component="span" />
            <Box component="span" />
          </Box>
          <Typography variant="h5" noWrap>ShopVerse</Typography>
        </Stack>
        <IconButton aria-label="Close navigation" onClick={() => setNavOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider />
      {navItems(false)}
    </Box>
  );

  const desktopSidebar = (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        position: 'sticky',
        top: 0,
        height: '100vh',
        minWidth: 0,
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: (theme) => theme.transitions.create('width', {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
      }}
    >
      <Stack
        component="button"
        type="button"
        aria-label={desktopCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        onClick={() => setDesktopCollapsed((value) => !value)}
        direction="row"
        alignItems="center"
        justifyContent={desktopCollapsed ? 'center' : 'flex-start'}
        spacing={1}
        sx={{
          width: '100%',
          minHeight: desktopCollapsed ? 78 : 82,
          px: desktopCollapsed ? 1.25 : 2,
          py: desktopCollapsed ? 1.25 : 1.5,
          border: 0,
          bgcolor: 'transparent',
          color: 'text.primary',
          cursor: 'pointer',
          position: 'relative',
          font: 'inherit',
          transition: 'background-color 160ms ease',
          '&:hover': { bgcolor: 'warning.light' },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={desktopCollapsed ? 'center' : 'flex-start'}
          spacing={1.1}
          sx={{
            width: desktopCollapsed ? 54 : '100%',
            height: desktopCollapsed ? 54 : 'auto',
            mx: desktopCollapsed ? 'auto' : 0,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: desktopCollapsed ? 54 : 30,
              height: desktopCollapsed ? 54 : 30,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              flex: '0 0 auto',
              '& span': {
                width: 28,
                height: 4,
                bgcolor: 'primary.main',
                borderRadius: '999px',
              },
            }}
          >
            <Box component="span" />
            <Box component="span" />
            <Box component="span" />
          </Box>
          {!desktopCollapsed && (
            <Typography variant="h5" noWrap>
              ShopVerse
            </Typography>
          )}
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'visible', py: 1.5 }}>
        {navItems(desktopCollapsed)}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: desktopCollapsed ? '88px minmax(0, 1fr)' : '280px minmax(0, 1fr)',
        },
        transition: (theme) => theme.transitions.create('grid-template-columns', {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
      }}
    >
      {desktopSidebar}
      <Box sx={{ minWidth: 0, bgcolor: 'background.default' }}>
        <AdminHeader>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0, flexShrink: 0 }}>
            <IconButton
              aria-label="Open navigation"
              onClick={() => {
                setNavOpen(true);
              }}
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: { xs: 'inline-flex', lg: 'none' },
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h3" component="h1" sx={{ lineHeight: 1 }} noWrap>
              {tabs.find((tab) => tab.path === current)?.label || 'Dashboard'}
            </Typography>
          </Stack>
          <AdminGlobalSearch />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={1}
            sx={{
              minWidth: 0,
              ml: { md: 'auto' },
              pr: { md: 0 },
              flexShrink: 0,
              alignSelf: { md: 'stretch' },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<StorefrontOutlinedIcon />}
              onClick={() => navigate('/')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Shop
            </Button>
            <ThemeToggle />
            <IconButton aria-label="Notifications" onClick={openNotifications} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <Badge color="error" badgeContent={unread}>
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
            <Stack
              component="button"
              type="button"
              direction="row"
              alignItems="center"
              spacing={1}
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              sx={{
                minWidth: 180,
                display: { xs: 'none', md: 'flex' },
                border: 0,
                bgcolor: 'transparent',
                color: 'text.primary',
                cursor: 'pointer',
                p: 0,
                textAlign: 'left',
              }}
            >
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
            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={() => setNotifAnchor(null)}
              slotProps={{ paper: { sx: { width: 340, maxWidth: 'calc(100vw - 24px)' } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">Notifications</Typography>
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 2 }}>
                  <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
                </Box>
              ) : notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => openNotificationTarget(notification)}
                  sx={{ alignItems: 'stretch', flexDirection: 'column', whiteSpace: 'normal', py: 1.25 }}
                >
                  <Typography variant="body2" fontWeight={notification.read ? 600 : 900}>
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.message}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
              <MenuItem onClick={() => { setProfileAnchor(null); navigate('/profile'); }}>Profile</MenuItem>
              <MenuItem onClick={() => { setProfileAnchor(null); navigate('/admin/settings'); }}>Admin settings</MenuItem>
              <MenuItem onClick={() => { setProfileAnchor(null); navigate('/'); }}>Open storefront</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Stack>
        </AdminHeader>
        <AdminContent>
          <Outlet />
        </AdminContent>
      </Box>
      <Drawer
        anchor="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        ModalProps={{
          keepMounted: true,
          BackdropProps: {
            sx: {
              backgroundColor: 'rgba(18, 16, 14, 0.34)',
              backdropFilter: 'blur(2px)',
              transition: (theme) => theme.transitions.create(['opacity', 'backdrop-filter'], {
                duration: theme.transitions.duration.enteringScreen,
                easing: theme.transitions.easing.easeOut,
              }),
            },
          },
        }}
        SlideProps={{
          timeout: { enter: 280, exit: 220 },
          easing: {
            enter: 'cubic-bezier(0.2, 0, 0, 1)',
            exit: 'cubic-bezier(0.4, 0, 1, 1)',
          },
        }}
        PaperProps={{
          sx: {
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.24)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

function AdminHeader({ children }) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={2}
      sx={{
        width: '100%',
        px: { xs: 2, md: 3.5 },
        pt: { xs: 2, md: 3.5 },
        pb: 2.5,
      }}
    >
      {children}
    </Stack>
  );
}

function AdminContent({ children }) {
  return (
    <Box component="main" sx={{ px: { xs: 2, md: 3.5 }, pb: { xs: 2, md: 3.5 } }}>
      {children}
    </Box>
  );
}

function SidebarItem({ active = false, collapsed = false, icon, label, onClick }) {
  const item = (
    <Box
      component="button"
      type="button"
      aria-label={collapsed ? label : undefined}
      onClick={onClick}
      sx={{
        width: '100%',
        maxWidth: collapsed ? 54 : 'none',
        minHeight: collapsed ? 54 : 48,
        mx: collapsed ? 'auto' : 0,
        px: collapsed ? 0 : 2,
        border: 0,
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 1.5,
        textAlign: collapsed ? 'center' : 'left',
        color: active ? '#ffffff' : 'text.secondary',
        bgcolor: active ? 'primary.main' : 'transparent',
        font: 'inherit',
        fontWeight: active ? 800 : 700,
        transition: 'background-color 160ms ease, color 160ms ease, padding 200ms ease',
        '& svg': { fontSize: 22 },
        '&:hover': {
          bgcolor: active ? 'primary.main' : 'warning.light',
          color: active ? '#ffffff' : 'text.primary',
        },
      }}
    >
      {icon}
      {!collapsed && <Typography variant="body1" fontWeight="inherit">{label}</Typography>}
    </Box>
  );

  if (!collapsed) return item;
  return (
    <Tooltip title={label} placement="right">
      {item}
    </Tooltip>
  );
}
