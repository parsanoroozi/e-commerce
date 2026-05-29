import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { productsApi } from '../api/products';
import { reviewsApi } from '../api/reviews';
import { wishlistApi } from '../api/wishlist';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { ProductGridSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';
import { showError, showSuccess } from '../utils/toast';

function trackRecent(id) {
  try {
    const raw = localStorage.getItem('shopverse_recent');
    const ids = raw ? JSON.parse(raw) : [];
    const next = [Number(id), ...ids.filter((x) => x !== Number(id))].slice(0, 6);
    localStorage.setItem('shopverse_recent', JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsApi.get(id),
      productsApi.related(id),
      reviewsApi.list(id).then((p) => p.content ?? p),
    ])
      .then(([prod, rel, revs]) => {
        setProduct(prod);
        setRelated(rel);
        setReviews(revs);
        const imgs = prod.images?.length ? prod.images : prod.imageUrl ? [prod.imageUrl] : [];
        setActiveImage(imgs[0] || '');
        trackRecent(id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    wishlistApi
      .list()
      .then((items) => setInWishlist(items.some((p) => p.id === Number(id))))
      .catch(() => {});
  }, [id, isAuthenticated]);

  const gallery = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      await cartApi.addItem({ productId: Number(id), quantity });
      showSuccess('Added to cart');
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      if (inWishlist) {
        await wishlistApi.remove(id);
        setInWishlist(false);
        showSuccess('Removed from wishlist');
      } else {
        await wishlistApi.add(id);
        setInWishlist(true);
        showSuccess('Added to wishlist');
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      const created = await reviewsApi.create(id, reviewForm);
      setReviews((prev) => [created, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      showSuccess('Review submitted');
      setProduct(await productsApi.get(id));
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ProductGridSkeleton count={1} />
      </PageContainer>
    );
  }
  if (error && !product) {
    return (
      <PageContainer>
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }
  if (!product) return null;

  return (
    <PageContainer>
      <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to shop
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            component="img"
            src={resolveImageUrl(activeImage || product.imageUrl)}
            alt={product.name}
            sx={{ width: '100%', borderRadius: 3, maxHeight: 440, objectFit: 'cover' }}
          />
          {gallery.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {gallery.map((url) => (
                <Box
                  key={url}
                  component="button"
                  onClick={() => setActiveImage(url)}
                  sx={{
                    p: 0,
                    border: 2,
                    borderColor: activeImage === url ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    bgcolor: 'transparent',
                  }}
                >
                  <Box component="img" src={resolveImageUrl(url)} alt="" sx={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" color="text.secondary">{product.categoryName}</Typography>
          <Typography variant="h4" component="h1">{product.name}</Typography>
          {product.reviewCount > 0 && (
            <Box sx={{ my: 1 }}>
              <StarRating value={product.averageRating} count={product.reviewCount} />
            </Box>
          )}
          <Typography variant="h4" color="primary" sx={{ my: 1 }}>
            ${Number(product.price).toFixed(2)}
          </Typography>
          <Typography color="text.secondary" paragraph>{product.description}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            In stock: {product.stockQuantity}
          </Typography>
          <TextField
            label="Quantity"
            type="number"
            size="small"
            sx={{ width: 100, my: 2 }}
            inputProps={{ min: 1, max: product.stockQuantity }}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" disabled={product.stockQuantity < 1} onClick={addToCart}>
              Add to cart
            </Button>
            <Button
              variant="outlined"
              startIcon={inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={toggleWishlist}
            >
              {inWishlist ? 'In wishlist' : 'Add to wishlist'}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>Customer reviews</Typography>
        {isAuthenticated && (
          <Box component="form" onSubmit={submitReview} sx={{ mb: 3, maxWidth: 480 }}>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Rating</InputLabel>
                <Select
                  value={reviewForm.rating}
                  label="Rating"
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <MenuItem key={n} value={n}>{n} stars</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Comment"
                multiline
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
              />
              <Button type="submit" variant="contained" size="small" sx={{ alignSelf: 'flex-start' }}>
                Post review
              </Button>
            </Stack>
          </Box>
        )}
        {reviews.length === 0 ? (
          <Typography color="text.secondary">No reviews yet. Be the first!</Typography>
        ) : (
          <Stack spacing={2} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {reviews.map((r) => (
              <Box key={r.id}>
                <StarRating value={r.rating} />
                <Typography variant="subtitle2" component="span" sx={{ ml: 1 }}>
                  {r.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </Typography>
                {r.comment && <Typography sx={{ mt: 1 }}>{r.comment}</Typography>}
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      {related.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>You may also like</Typography>
          <Grid container spacing={2}>
            {related.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </PageContainer>
  );
}
