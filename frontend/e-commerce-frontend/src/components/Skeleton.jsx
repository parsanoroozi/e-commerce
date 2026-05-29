import { Card, CardContent, Grid, Skeleton } from '@mui/material';

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card>
            <Skeleton variant="rectangular" height={160} />
            <CardContent>
              <Skeleton width="80%" />
              <Skeleton width="40%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
