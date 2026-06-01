import { Card, CardContent, Stack, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';

const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains how ShopVerse handles customer account, order, and support information.',
    sections: [
      ['Information we collect', 'We collect account details, shipping addresses, order activity, payment status, and support messages needed to operate the store.'],
      ['How we use it', 'We use this information to process orders, provide customer support, prevent fraud, improve the storefront, and send transactional updates.'],
      ['Payment data', 'Payment details are handled by payment providers. The store keeps payment status, totals, and references needed for receipts and support.'],
      ['Customer choices', 'Customers can update profile details, manage addresses, and contact support about account or order information.'],
    ],
  },
  returns: {
    title: 'Return Policy',
    intro: 'We want returns to be clear before you buy and easy to follow after delivery.',
    sections: [
      ['Return window', 'Most unused items can be returned within 30 days of delivery unless the product page states a different policy.'],
      ['Return condition', 'Items should be returned with original packaging, accessories, and proof of purchase.'],
      ['Refund timing', 'Approved refunds are issued to the original payment method after the returned item is received and inspected.'],
      ['Non-returnable items', 'Final sale, personalized, perishable, or hygiene-sensitive items may be excluded when noted on the product page.'],
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    intro: 'Shipping options and costs are shown during checkout before payment.',
    sections: [
      ['Processing', 'Orders are prepared after payment confirmation. Processing times may vary by inventory and fulfillment volume.'],
      ['Delivery options', 'Standard and express shipping options may be available depending on store settings and destination.'],
      ['Tracking', 'When tracking is available, it appears on the order detail page and may be sent by email.'],
      ['Address accuracy', 'Customers are responsible for selecting or entering a complete shipping address before payment.'],
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    intro: 'These terms describe the basic rules for using the ShopVerse storefront.',
    sections: [
      ['Store use', 'Use the storefront lawfully and provide accurate account, shipping, and payment information.'],
      ['Product information', 'We work to keep prices, inventory, images, and descriptions accurate, but availability may change before checkout is complete.'],
      ['Orders', 'An order is accepted when payment is confirmed and the order status updates. Orders may be cancelled or refunded when fulfillment is not possible.'],
      ['Liability', 'The store is not responsible for indirect losses, carrier delays outside its control, or misuse of products after delivery.'],
    ],
  },
};

export default function PolicyPage({ type }) {
  const policy = POLICIES[type] || POLICIES.privacy;

  return (
    <PageContainer>
      <Stack spacing={3}>
        <div>
          <Typography variant="overline" color="primary">Policies</Typography>
          <Typography variant="h3" component="h1" gutterBottom>{policy.title}</Typography>
          <Typography color="text.secondary" maxWidth={760}>{policy.intro}</Typography>
        </div>
        <Stack spacing={2}>
          {policy.sections.map(([title, text]) => (
            <Card key={title} variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                <Typography color="text.secondary">{text}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Last updated: June 1, 2026
        </Typography>
      </Stack>
    </PageContainer>
  );
}
