import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

function Row({ label, value, highlight, tone }) {
  return (
    <TableRow
      sx={{
        '& td': { borderBottom: highlight ? 0 : '1px solid', borderColor: 'divider' },
      }}
    >
      <TableCell sx={{ px: 0, py: highlight ? 1.25 : 0.9 }}>
        <Typography variant="body2" color={highlight ? 'text.primary' : 'text.secondary'} fontWeight={highlight ? 700 : 500}>
          {label}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ px: 0, py: highlight ? 1.25 : 0.9 }}>
        <Typography
          variant={highlight ? 'h6' : 'body2'}
          fontWeight={highlight ? 800 : 600}
          color={tone || (highlight ? 'primary' : 'text.primary')}
        >
          {value}
        </Typography>
      </TableCell>
    </TableRow>
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
    <Box
      sx={{
        mt: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        px: 2,
        py: 1,
      }}
    >
      <TableContainer>
        <Table size="small" aria-label="Pricing summary">
          <TableBody>
            <Row label="Subtotal" value={`$${Number(subtotal).toFixed(2)}`} />
            {discount > 0 && (
              <Row
                label={`Discount${couponCode ? ` (${couponCode})` : ''}`}
                value={`-$${Number(discount).toFixed(2)}`}
                tone="success.main"
              />
            )}
            <Row
              label={`Shipping${shippingMethod ? ` (${shippingMethod})` : ''}`}
              value={`$${Number(shipping).toFixed(2)}`}
            />
            <Row label="Tax" value={`$${Number(tax).toFixed(2)}`} />
            <Row label="Total" value={`$${Number(total).toFixed(2)}`} highlight />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
