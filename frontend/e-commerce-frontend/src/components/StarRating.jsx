import { Rating, Stack, Typography } from '@mui/material';

export default function StarRating({ value = 0, count, size = 'small' }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Rating value={value || 0} precision={0.5} readOnly size={size} />
      {count != null && (
        <Typography variant="caption" color="text.secondary">
          ({count})
        </Typography>
      )}
    </Stack>
  );
}
