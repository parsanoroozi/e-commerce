import { Chip, Step, StepLabel, Stepper, Typography } from '@mui/material';

const STEPS = ['AWAITING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const LABELS = {
  AWAITING_PAYMENT: 'Payment',
  PENDING: 'Processing',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return <Chip label={LABELS[status]} color="error" variant="outlined" sx={{ my: 2 }} />;
  }
  const idx = STEPS.indexOf(status === 'PENDING' ? 'CONFIRMED' : status);
  return (
    <Stepper
      activeStep={idx < 0 ? 0 : idx}
      alternativeLabel
      sx={{ my: 2, display: { xs: 'none', sm: 'flex' } }}
    >
      {STEPS.map((step) => (
        <Step key={step}>
          <StepLabel>{LABELS[step]}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export function OrderTimelineMobile({ status }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ display: { sm: 'none' }, my: 1 }}>
      Status: <strong>{LABELS[status] || status}</strong>
    </Typography>
  );
}
