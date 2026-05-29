import { Button, Card, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { wishlistApi } from '../api/wishlist';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError, showSuccess } from '../utils/toast';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    wishlistApi
      .list()
      .then(setItems)
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

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
              <ProductCard product={p} />
              <Button size="small" color="inherit" onClick={() => remove(p.id)} sx={{ mt: 1 }}>
                Remove
              </Button>
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
}
