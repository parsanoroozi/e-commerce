import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { storefrontApi } from '../../api/storefront';
import { resolveImageUrl } from '../../utils/imageUrl';

export default function AppFooter() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    storefrontApi.settings().then(setSettings).catch(() => {});
  }, []);

  const brandName = settings?.brandName || 'ShopVerse';
  const logoUrl = settings?.logoUrl ? resolveImageUrl(settings.logoUrl) : null;

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        backgroundImage: (t) =>
          t.palette.mode === 'dark'
            ? `linear-gradient(90deg, ${t.palette.primary.main}18, ${t.palette.secondary.main}14)`
            : `linear-gradient(90deg, ${t.palette.primary.light}1f, ${t.palette.secondary.light}26)`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          justifyContent="space-between"
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              {logoUrl && (
                <Box
                  component="img"
                  src={logoUrl}
                  alt={`${brandName} logo`}
                  sx={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 1 }}
                />
              )}
              <Typography variant="h6" sx={{ fontFamily: '"Instrument Serif", serif' }}>
                {brandName}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Quality products, seamless checkout.
            </Typography>
            {settings?.contactEmail && (
              <Link href={`mailto:${settings.contactEmail}`} color="text.secondary" sx={{ display: 'inline-block', mt: 1 }}>
                {settings.contactEmail}
              </Link>
            )}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Shop</Typography>
              <Link component={RouterLink} to="/" color="text.secondary">Catalog</Link>
              <Link component={RouterLink} to="/cart" color="text.secondary">Cart</Link>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Company</Typography>
              <Link component={RouterLink} to="/about" color="text.secondary">About</Link>
              <Link component={RouterLink} to="/contact" color="text.secondary">Contact</Link>
              <Link component={RouterLink} to="/shipping-policy" color="text.secondary">Shipping policy</Link>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Account</Typography>
              <Link component={RouterLink} to="/orders" color="text.secondary">Orders</Link>
              <Link component={RouterLink} to="/addresses" color="text.secondary">Addresses</Link>
              <Link component={RouterLink} to="/profile" color="text.secondary">Profile</Link>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">Policies</Typography>
              <Link component={RouterLink} to="/privacy" color="text.secondary">Privacy policy</Link>
              <Link component={RouterLink} to="/returns" color="text.secondary">Return policy</Link>
              <Link component={RouterLink} to="/terms" color="text.secondary">Terms</Link>
            </Stack>
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3 }}>
          (c) {new Date().getFullYear()} {brandName}
        </Typography>
      </Container>
    </Box>
  );
}
