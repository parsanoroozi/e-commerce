import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" sx={{ fontFamily: '"Instrument Serif", serif', mb: 0.5 }}>
              ShopVerse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quality products, seamless checkout.
            </Typography>
          </Box>
          <Stack direction="row" spacing={4}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Shop</Typography>
              <Link component={RouterLink} to="/" color="text.secondary">Catalog</Link>
              <Link component={RouterLink} to="/cart" color="text.secondary">Cart</Link>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Account</Typography>
              <Link component={RouterLink} to="/orders" color="text.secondary">Orders</Link>
              <Link component={RouterLink} to="/addresses" color="text.secondary">Addresses</Link>
              <Link component={RouterLink} to="/profile" color="text.secondary">Profile</Link>
            </Stack>
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} ShopVerse
        </Typography>
      </Container>
    </Box>
  );
}
