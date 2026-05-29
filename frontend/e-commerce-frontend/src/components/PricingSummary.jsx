import { Divider, Stack, Typography } from '@mui/material';

function Row({ label, value, highlight }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={highlight ? 700 : 500} color={highlight ? 'primary' : 'text.primary'}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function PricingSummary({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  couponCode,
  shippingMethod,
}) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <Row label="Subtotal" value={`$${Number(subtotal).toFixed(2)}`} />
      {discount > 0 && (
        <Row
          label={`Discount${couponCode ? ` (${couponCode})` : ''}`}
          value={`−$${Number(discount).toFixed(2)}`}
        />
      )}
      <Row
        label={`Shipping${shippingMethod ? ` (${shippingMethod})` : ''}`}
        value={`$${Number(shipping).toFixed(2)}`}
      />
      <Row label="Tax" value={`$${Number(tax).toFixed(2)}`} />
      <Divider sx={{ my: 1 }} />
      <Row label="Total" value={`$${Number(total).toFixed(2)}`} highlight />
    </Stack>
  );
}
