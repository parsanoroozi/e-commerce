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
  const [variantId, setVariantId] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.allSettled([
      productsApi.get(id, { signal: controller.signal }),
      productsApi.related(id, { signal: controller.signal }),
      reviewsApi.list(id, 0, { signal: controller.signal }).then((p) => p.content ?? p),
    ])
      .then(([productResult, relatedResult, reviewsResult]) => {
        if (productResult.status === 'rejected') {
          throw productResult.reason;
        }
        const prod = productResult.value;
        setProduct(prod);
        setRelated(relatedResult.status === 'fulfilled' ? relatedResult.value : []);
        setReviews(reviewsResult.status === 'fulfilled' ? reviewsResult.value : []);
        const primary = prod.imageDetails?.find((image) => image.primaryImage)?.url;
        const imgs = prod.imageDetails?.length ? prod.imageDetails.map((image) => image.url) : prod.images?.length ? prod.images : prod.imageUrl ? [prod.imageUrl] : [];
        setActiveImage(primary || imgs[0] || '');
        const firstAvailableVariant = prod.variants?.find((v) => v.active && v.stockQuantity > 0);
        setVariantId(firstAvailableVariant ? String(firstAvailableVariant.id) : '');
        setQuantity(1);
        trackRecent(id);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    wishlistApi
      .list()
      .then((items) => setInWishlist(items.some((p) => p.id === Number(id))))
      .catch(() => {});
  }, [id, isAuthenticated]);

  const gallery = product?.imageDetails?.length
    ? product.imageDetails
    : (product?.images?.length
      ? product.images.map((url) => ({ url, altText: product.name }))
      : product?.imageUrl
        ? [{ url: product.imageUrl, altText: product.name }]
        : []);
  const activeVariants = product?.variants?.filter((v) => v.active) || [];
  const selectedVariant = activeVariants.find((v) => String(v.id) === String(variantId));
  const availableStock = selectedVariant ? selectedVariant.stockQuantity : product?.stockQuantity || 0;

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      await cartApi.addItem({
        productId: Number(id),
        variantId: selectedVariant ? selectedVariant.id : null,
        quantity,
      });
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
              {gallery.map((image) => (
                <Box
                  key={image.id || image.url}
                  component="button"
                  onClick={() => setActiveImage(image.url)}
                  sx={{
                    p: 0,
                    border: 2,
                    borderColor: activeImage === image.url ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    bgcolor: 'transparent',
                  }}
                >
                  <Box component="img" src={resolveImageUrl(image.url)} alt={image.altText || product.name} sx={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
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
            In stock: {availableStock}
          </Typography>
          {activeVariants.length > 0 && (
            <FormControl size="small" fullWidth sx={{ maxWidth: 360, my: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={variantId}
                label="Variant"
                onChange={(e) => {
                  const next = activeVariants.find((v) => String(v.id) === String(e.target.value));
                  setVariantId(e.target.value);
                  setQuantity((current) => Math.min(Math.max(1, current), next?.stockQuantity || 1));
                }}
              >
                {activeVariants.map((variant) => (
                  <MenuItem key={variant.id} value={String(variant.id)} disabled={variant.stockQuantity < 1}>
                    {variant.displayName || variant.sku || `Variant #${variant.id}`} - {variant.stockQuantity} left
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Quantity"
            type="number"
            size="small"
            sx={{ width: 100, my: 2 }}
            inputProps={{ min: 1, max: availableStock }}
            value={quantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) {
                setQuantity(1);
                return;
              }
              setQuantity(Math.min(availableStock, Math.max(1, Math.floor(next))));
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" disabled={availableStock < 1 || (activeVariants.length > 0 && !selectedVariant)} onClick={addToCart}>
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
