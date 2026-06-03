import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AppFooter from './layout/AppFooter';

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <Box className="luxury-shell" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {children}
      {!isAdmin && <AppFooter />}
    </Box>
  );
}
