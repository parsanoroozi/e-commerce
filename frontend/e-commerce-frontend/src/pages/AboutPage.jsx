import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { storefrontApi } from '../api/storefront';
import PageContainer from '../components/layout/PageContainer';

const values = [
  { icon: <CheckCircleOutlinedIcon />, title: 'Curated catalog', text: 'Products are organized around clear details, availability, and reliable fulfillment.' },
  { icon: <PaymentsOutlinedIcon />, title: 'Secure checkout', text: 'Payments are handled through a protected checkout flow with order status visibility.' },
  { icon: <LocalShippingOutlinedIcon />, title: 'Practical delivery', text: 'Shipping options, tracking details, and invoices stay connected to each order.' },
  { icon: <SupportAgentOutlinedIcon />, title: 'Responsive support', text: 'Customers can reach the store team for order, return, and product questions.' },
];

export default function AboutPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    storefrontApi.settings().then(setSettings).catch(() => {});
  }, []);

  const brandName = settings?.brandName || 'ShopVerse';

  return (
    <PageContainer>
      <Stack spacing={4}>
        <Box>
          <Typography variant="overline" color="primary">About</Typography>
          <Typography variant="h3" component="h1" gutterBottom>{brandName}</Typography>
          <Typography color="text.secondary" maxWidth={760}>
            {brandName} is built around a simple promise: make it easy to discover products,
            understand what you are buying, and track each order after checkout.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {values.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1, '& svg': { fontSize: 30 } }}>{item.icon}</Box>
                  <Typography fontWeight={800} gutterBottom>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box>
          <Typography variant="h5" gutterBottom>How we operate</Typography>
          <Typography color="text.secondary" maxWidth={820}>
            We keep product information, checkout totals, shipping updates, and support policies
            visible throughout the shopping journey. The result is a storefront that feels clear
            before purchase and accountable after purchase.
          </Typography>
        </Box>
      </Stack>
    </PageContainer>
  );
}
