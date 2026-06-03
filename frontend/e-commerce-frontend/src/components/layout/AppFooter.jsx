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
        py: { xs: 5, md: 7 },
        borderTop: 1,
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={4}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
              {logoUrl ? (
                <Box
                  component="img"
                  src={logoUrl}
                  alt={`${brandName} logo`}
                  sx={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 1 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '4px',
                    p: '7px',
                    bgcolor: 'primary.main',
                    borderRadius: 1.5,
                    '& span': { bgcolor: 'primary.contrastText', borderRadius: 0.5 },
                  }}
                >
                  <span />
                  <span />
                  <span />
                  <span />
                </Box>
              )}
              <Typography variant="h5" fontWeight={900}>
                {brandName}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.8 }}>
              Clean shopping, clear checkout, and useful account tools in one polished storefront.
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
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3, textAlign: 'center' }}>
          (c) {new Date().getFullYear()} {brandName}
        </Typography>
      </Container>
    </Box>
  );
}
