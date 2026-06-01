import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  retryLabel = 'Try again',
  onRetry,
  severity = 'empty',
}) {
  const actionProps = actionTo ? { component: RouterLink, to: actionTo } : {};
  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 4 },
        textAlign: 'center',
        borderStyle: severity === 'error' ? 'solid' : 'dashed',
        bgcolor: severity === 'error' ? 'error.main' : 'background.paper',
        color: severity === 'error' ? 'error.contrastText' : 'text.primary',
      }}
    >
      <Stack spacing={2} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: severity === 'error' ? 'rgba(255,255,255,0.16)' : 'action.hover',
              color: severity === 'error' ? 'inherit' : 'primary.main',
              '& svg': { fontSize: 30 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h6" gutterBottom>{title}</Typography>
          {message && (
            <Typography color={severity === 'error' ? 'inherit' : 'text.secondary'} sx={{ maxWidth: 520 }}>
              {message}
            </Typography>
          )}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
          {actionLabel && (
            <Button variant="contained" onClick={onAction} {...actionProps}>
              {actionLabel}
            </Button>
          )}
          {onRetry && (
            <Button
              variant={severity === 'error' ? 'contained' : 'outlined'}
              color={severity === 'error' ? 'inherit' : 'primary'}
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
