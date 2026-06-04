import { Card, CardContent, CircularProgress, Stack, TableCell, TableRow, Typography } from '@mui/material';

export function PageLoader({ label = 'Loading...' }) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
      <CircularProgress />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export function TableEmptyRow({ colSpan, message = 'No records found.' }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function MobileEmptyCard({ message = 'No records found.' }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}
