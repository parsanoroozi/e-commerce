import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { Grid, Pagination, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { subscribeToApiChanges } from '../api/client';
import { wishlistApi } from '../api/wishlist';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError, showSuccess } from '../utils/toast';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return wishlistApi
      .list(page)
      .then((data) => {
        setItems(data.content);
        setPageData(data);
      })
      .catch((err) => {
        setError(err.message);
        showError(err.message);
      })
      .finally(() => setLoading(false));
  }, [page]);

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
      ) : error ? (
        <EmptyState
          severity="error"
          icon={<FavoriteBorderOutlinedIcon />}
          title="Wishlist could not load"
          message={error}
          onRetry={load}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FavoriteBorderOutlinedIcon />}
          title="Your wishlist is empty"
          message="Save products you are considering so you can compare and return to them quickly."
          actionLabel="Browse products"
          actionTo="/"
        />
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
