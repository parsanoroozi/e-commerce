import { Rating, Stack, Typography } from '@mui/material';

export default function StarRating({
  value = 0,
  count,
  size = 'small',
  readOnly = true,
  onChange,
  precision = 0.5,
  name = 'rating',
  label,
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Rating
        name={name}
        value={Number(value) || 0}
        precision={precision}
        readOnly={readOnly}
        size={size}
        onChange={(_, next) => onChange?.(next || 0)}
        aria-label={label || name}
      />
      {count != null && (
        <Typography variant="caption" color="text.secondary">
          ({count})
        </Typography>
      )}
      {label && (
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      )}
    </Stack>
  );
}
