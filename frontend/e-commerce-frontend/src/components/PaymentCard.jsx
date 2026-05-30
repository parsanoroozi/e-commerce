import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

export default function PaymentCard({
  title = 'Secure payment',
  subtitle,
  orderId,
  totalAmount,
  mode = 'stripe',
  children,
}) {
  return (
    <Card
      sx={{
        overflow: 'hidden',
        border: 2,
        borderColor: 'primary.main',
        background: (t) =>
          t.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${t.palette.primary.main}2f 0%, ${t.palette.background.paper} 45%)`
            : `linear-gradient(145deg, ${t.palette.secondary.light}2b 0%, ${t.palette.background.paper} 50%)`,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: (t) =>
            t.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${t.palette.primary.main}4d, ${t.palette.secondary.main}33)`
              : `linear-gradient(90deg, ${t.palette.primary.light}33, ${t.palette.secondary.light}3d)`,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CreditCardOutlinedIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Chip
            size="small"
            icon={<ShieldOutlinedIcon />}
            label={mode === 'dev' ? 'Demo mode' : 'SSL secured'}
            color={mode === 'dev' ? 'warning' : 'success'}
            variant="outlined"
          />
        </Stack>
      </Box>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {(orderId != null || totalAmount != null) && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
              {orderId != null && (
                <Typography variant="body2" color="text.secondary">
                  Order <strong>#{orderId}</strong>
                </Typography>
              )}
              {totalAmount != null && (
                <Typography variant="h5" color="primary" fontWeight={700}>
                  ${Number(totalAmount).toFixed(2)}
                </Typography>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
          <LockOutlinedIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Your payment details are encrypted and never stored on our servers.
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}
