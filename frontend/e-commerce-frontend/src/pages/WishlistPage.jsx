import { Button, Card, Grid, Pagination, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { subscribeToApiChanges } from '../api/client';
import { wishlistApi } from '../api/wishlist';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError, showSuccess } from '../utils/toast';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() =>
    wishlistApi
      .list(page)
      .then((data) => {
        setItems(data.content);
        setPageData(data);
      })
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false)), [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeToApiChanges((change) => {
      if (change?.resources?.includes('wishlist')) {
        load();
      }
    });
  }, [load]);

  const remove = async (id) => {
    await wishlistApi.remove(id);
    showSuccess('Removed from wishlist');
    load();
  };

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>Wishlist</Typography>
      {loading ? (
        <ProductGridSkeleton />
      ) : items.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>Your wishlist is empty.</Typography>
          <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>Browse products</Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {items.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ProductCard product={p} onRemove={remove} />
            </Grid>
          ))}
        </Grid>
      )}
      {pageData.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageData.totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}
    </PageContainer>
  );
}
