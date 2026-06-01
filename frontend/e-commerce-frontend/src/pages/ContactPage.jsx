import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { storefrontApi } from '../api/storefront';
import PageContainer from '../components/layout/PageContainer';

export default function ContactPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    storefrontApi.settings().then(setSettings).catch(() => {});
  }, []);

  const email = settings?.contactEmail || 'support@shopverse.local';
  const phone = settings?.contactPhone || 'Add a support phone number in admin settings.';
  const address = settings?.contactAddress || 'Add a store address in admin settings.';

  return (
    <PageContainer>
      <Stack spacing={3}>
        <div>
          <Typography variant="overline" color="primary">Contact</Typography>
          <Typography variant="h3" component="h1" gutterBottom>We are here to help</Typography>
          <Typography color="text.secondary" maxWidth={720}>
            Send questions about orders, returns, shipping, or products. Include your order number
            when you have one so support can respond faster.
          </Typography>
        </div>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ContactCard icon={<EmailOutlinedIcon />} title="Email" value={email} action={<Button href={`mailto:${email}`} variant="contained">Email support</Button>} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ContactCard icon={<PhoneOutlinedIcon />} title="Phone" value={phone} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ContactCard icon={<HomeOutlinedIcon />} title="Address" value={address} />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}

function ContactCard({ icon, title, value, action }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ color: 'primary.main', '& svg': { fontSize: 30 } }}>{icon}</Box>
          <div>
            <Typography fontWeight={800}>{title}</Typography>
            <Typography color="text.secondary">{value}</Typography>
          </div>
          {action}
        </Stack>
      </CardContent>
    </Card>
  );
}
