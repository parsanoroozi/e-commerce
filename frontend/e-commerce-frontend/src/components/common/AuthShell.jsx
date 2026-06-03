import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import PageContainer from '../layout/PageContainer';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <PageContainer maxWidth="lg">
      <Grid
        container
        spacing={{ xs: 3, md: 4 }}
        sx={{ py: { xs: 2, md: 5 }, alignItems: 'stretch' }}
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            className="luxury-scroll-card"
            sx={{
              height: '100%',
              minHeight: { xs: 320, md: 620 },
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'warning.light',
              backgroundImage: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(34,33,31,0.08), rgba(34,33,31,0.58)), url(/luxury-assets/concierge-panel.png)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,233,210,0.68)), url(/luxury-assets/concierge-panel.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 18,
                border: '1px solid rgba(255,122,0,0.24)',
                pointerEvents: 'none',
              }}
            />
            <Stack
              spacing={1.5}
              sx={{
                position: 'absolute',
                left: 28,
                right: 28,
                bottom: 28,
                color: 'text.primary',
                p: 2,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(34,33,31,0.86)' : 'rgba(255,255,255,0.82)',
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(14px)',
              }}
            >
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
              <Typography variant="h4">Clean access</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                Sign in to manage orders, saved products, addresses, and checkout in one calm workspace.
              </Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            className="luxury-scroll-card"
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              p: { xs: 0, md: 1.5 },
            }}
          >
            <CardContent sx={{ width: '100%', maxWidth: 520, mx: 'auto', p: { xs: 2.5, sm: 4, md: 5 } }}>
              <Typography variant="overline" color="primary.main" fontWeight={900}>
                {subtitle}
              </Typography>
              <Typography variant="h3" component="h1" sx={{ mb: 2, lineHeight: 1 }}>
                {title}
              </Typography>
              {children}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
