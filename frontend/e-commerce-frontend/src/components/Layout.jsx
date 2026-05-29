import { Box } from '@mui/material';
import AppFooter from './layout/AppFooter';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {children}
      <AppFooter />
    </Box>
  );
}
