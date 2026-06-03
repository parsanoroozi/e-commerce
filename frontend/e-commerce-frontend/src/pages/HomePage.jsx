import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import { storefrontApi } from '../api/storefront';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { resolveImageUrl } from '../utils/imageUrl';
import { showError } from '../utils/toast';

const PRICE_LIMIT = 2000;

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { categoryId: categoryParam } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [settings, setSettings] = useState(null);
  const [categoryId, setCategoryId] = useState(categoryParam || '');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState([0, PRICE_LIMIT]);
  const [inStock, setInStock] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('name,asc');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const heroProduct = featured[0] || products[0];
  const heroProductImage = heroProduct?.imageDetails?.find((entry) => entry.primaryImage)
    || heroProduct?.imageDetails?.[0];
  const heroImageUrl = settings?.homepageBannerImageUrl
    || heroProductImage?.url
    || heroProduct?.imageUrl
    || '/luxury-assets/atelier-hero.png';

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
    productsApi.featured().then(setFeatured).catch(() => {});
    storefrontApi.settings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setCategoryId(categoryParam || '');
    setPage(0);
  }, [categoryParam]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setProductsError('');
    const [sortField, sortDir] = sort.split(',');
    productsApi
      .list({
        categoryId: categoryId || undefined,
        search: debouncedSearch || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < PRICE_LIMIT ? priceRange[1] : undefined,
        inStock,
        minRating: minRating || undefined,
        page,
        size: 12,
        sort: `${sortField},${sortDir}`,
      }, { signal: controller.signal })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setProductsError(err.message);
          showError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [categoryId, debouncedSearch, inStock, minRating, page, priceRange, reloadKey, sort]);

  return (
    <PageContainer maxWidth="xl" sx={{ pt: { xs: 3, md: 5 } }}>
      <Card
        className="luxury-reveal"
        sx={{
          position: 'relative',
          mb: { xs: 3, md: 5 },
          minHeight: { xs: 640, md: 560 },
          overflow: 'hidden',
          p: { xs: 2.5, sm: 4, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          alignItems: 'center',
          gap: { xs: 4, md: 6 },
          borderColor: 'divider',
          bgcolor: 'background.paper',
          background: (t) => t.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #22211f 0%, #2a2926 58%, #3a2615 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #fff4e8 55%, #ffe9d2 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 18,
            border: '1px solid',
            borderColor: 'rgba(255,122,0,0.14)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
            <Chip label={settings?.brandName || 'ShopVerse'} color="primary" />
            <Chip icon={<VerifiedOutlinedIcon />} label="Verified store" variant="outlined" />
          </Stack>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              maxWidth: 760,
              fontSize: { xs: 48, sm: 66, md: 86 },
              lineHeight: 0.92,
              mb: 2.5,
            }}
          >
            {settings?.homepageBannerTitle || 'A cleaner way to shop the catalog.'}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 620, fontSize: { xs: 17, md: 20 }, lineHeight: 1.8 }}
          >
            {settings?.homepageBannerSubtitle || 'Browse real products with quick filters, clear prices, and a calm path from discovery to checkout.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
            <Button
              variant="contained"
              href={settings?.homepageBannerCtaUrl || '#collection'}
              size="large"
            >
              {settings?.homepageBannerCtaText || 'Shop collection'}
            </Button>
            <Button variant="outlined" href="#featured" size="large">
              View featured
            </Button>
          </Stack>
          <Box
            sx={{
              mt: 5,
              maxWidth: 760,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            {[
              { icon: <ShieldOutlinedIcon />, label: 'Secure checkout' },
              { icon: <LocalShippingOutlinedIcon />, label: 'Fast fulfillment' },
              { icon: <Inventory2OutlinedIcon />, label: 'Live catalog' },
            ].map((item) => (
              <Stack
                key={item.label}
                direction="row"
                spacing={1}
                sx={{
                  minWidth: 0,
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.68)',
                }}
              >
                <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{item.icon}</Box>
                <Typography variant="body2" fontWeight={800} noWrap>{item.label}</Typography>
              </Stack>
            ))}
          </Box>
          <Box
            className="luxury-marquee"
            sx={{
              mt: 4,
              py: 1.5,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
              maxWidth: 760,
            }}
          >
            <Box className="luxury-marquee-track">
              {[
                'clean catalog',
                'visual browsing',
                'smart filters',
                'secure checkout',
                'fast fulfillment',
                'easy account tools',
                'clean catalog',
                'visual browsing',
                'smart filters',
                'secure checkout',
                'fast fulfillment',
                'easy account tools',
              ].map((label, index) => (
                <Typography
                  key={`${label}-${index}`}
                  variant="overline"
                  sx={{ px: 2.5, color: index % 2 ? 'secondary.main' : 'primary.main', fontWeight: 900 }}
                >
                  {label}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          className="hero-float"
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: { xs: 340, md: 480 },
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            className="hero-orbit"
            sx={{
              position: 'absolute',
              width: { xs: 280, md: 420 },
              height: { xs: 280, md: 420 },
              border: '1px solid',
              borderColor: 'rgba(216,180,93,0.34)',
              borderRadius: '50%',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                boxShadow: '0 0 34px rgba(216,180,93,0.8)',
              },
              '&::before': { top: 30, left: 68 },
              '&::after': { right: 42, bottom: 76 },
            }}
          />
          <Box
            sx={{
              position: 'relative',
              width: { xs: '86%', md: 390 },
              aspectRatio: '3 / 4',
              p: 1.5,
              border: '1px solid',
              borderColor: 'primary.main',
              boxShadow: (t) => t.palette.mode === 'dark'
                ? '0 38px 120px rgba(0,0,0,0.62), 0 0 60px rgba(216,180,93,0.18)'
                : '0 38px 100px rgba(122,79,24,0.22)',
              transform: 'rotate(2deg)',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              component={heroImageUrl ? 'img' : 'div'}
              src={heroImageUrl ? resolveImageUrl(heroImageUrl) : undefined}
              alt={heroProduct?.name || 'Featured collection'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                background: heroImageUrl
                  ? undefined
                  : 'linear-gradient(135deg, #ffe9d2, #ffffff)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: -26,
                bottom: 42,
                maxWidth: 260,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(34,33,31,0.92)' : 'rgba(255,255,255,0.9)',
                color: 'text.primary',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 18px 42px rgba(122,79,24,0.14)',
              }}
            >
              <Typography variant="overline" color="primary.main" fontWeight={900}>
                Featured pick
              </Typography>
              <Typography variant="subtitle1" fontWeight={900} noWrap>
                {heroProduct?.name || 'The catalog edit'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {heroProduct ? `$${Number(heroProduct.price).toFixed(2)}` : 'A cleaner way to browse'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={2.5} className="luxury-scroll-card" sx={{ mb: { xs: 3, md: 5 } }}>
        {[
          { label: 'Categories', value: categories.length || 1, max: Math.max(categories.length, 6) },
          { label: 'Featured', value: featured.length || 1, max: Math.max(featured.length, 6) },
          { label: 'Visible pieces', value: products.length || 1, max: 12 },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2.5, overflow: 'hidden' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={900}>{item.label}</Typography>
                <Typography variant="h4" color="primary.main">{item.value}</Typography>
              </Stack>
              <Stack direction="row" alignItems="end" spacing={0.75} sx={{ height: 74 }}>
                {Array.from({ length: 12 }).map((_, index) => {
                  const height = 18 + (((index + 3) * item.value) % 54);
                  const active = index < Math.ceil((item.value / item.max) * 12);
                  return (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        height,
                        bgcolor: active ? 'primary.main' : 'action.hover',
                        backgroundImage: active ? 'linear-gradient(180deg, #ffb36b, #ff7a00)' : 'none',
                        opacity: active ? 1 : 0.42,
                        transition: 'height 420ms ease, opacity 420ms ease',
                      }}
                    />
                  );
                })}
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {featured.length > 0 && (
        <Box id="featured" className="luxury-reveal" sx={{ mb: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
            <Box>
              <Typography variant="overline" color="primary.main" fontWeight={900}>Featured</Typography>
              <Typography variant="h4">Featured products</Typography>
            </Box>
            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
              A sharper first look at products with strong demand and availability.
            </Typography>
          </Stack>
          <Grid container spacing={2.5}>
            {featured.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Card
        id="collection"
        className="luxury-reveal"
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5 },
          position: 'sticky',
          top: { xs: 64, md: 80 },
          zIndex: 5,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TuneOutlinedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={900}>Collection controls</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            fullWidth
            size="small"
            placeholder="Search the collection..."
            value={search}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <FormControl size="small" sx={{ minWidth: { sm: 180 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryId} label="Category" onChange={(e) => {
              const next = e.target.value;
              setCategoryId(next);
              setPage(0);
              navigate(next ? `/categories/${next}` : '/');
            }}>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            className="price-range-rail"
            sx={{
              width: { xs: '100%', sm: 260 },
              px: 1.5,
              py: 0.75,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={900}>Price range</Typography>
              <Typography variant="caption" color="primary.main" fontWeight={900}>
                ${priceRange[0]} - ${priceRange[1]}
              </Typography>
            </Stack>
            <Slider
              value={priceRange}
              min={0}
              max={PRICE_LIMIT}
              step={25}
              valueLabelDisplay="auto"
              onChange={(_, value) => {
                setPriceRange(value);
                setPage(0);
              }}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 18,
                  height: 18,
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 8px 20px rgba(255,122,0,0.28)',
                },
                '& .MuiSlider-track': {
                  backgroundImage: 'linear-gradient(90deg, #ffd8b0, #ffad60, #ff7a00)',
                  border: 0,
                },
              }}
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Stock</InputLabel>
            <Select value={inStock ? 'IN_STOCK' : 'ALL'} label="Stock" onChange={(e) => {
              setInStock(e.target.value === 'IN_STOCK');
              setPage(0);
            }}>
              <MenuItem value="ALL">All stock</MenuItem>
              <MenuItem value="IN_STOCK">In stock</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Rating</InputLabel>
            <Select value={minRating} label="Rating" onChange={(e) => {
              setMinRating(e.target.value);
              setPage(0);
            }}>
              <MenuItem value="">Any rating</MenuItem>
              {[4, 3, 2, 1].map((rating) => (
                <MenuItem key={rating} value={rating}>{rating}+ stars</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 200 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Sort</InputLabel>
            <Select value={sort} label="Sort" onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}>
              <MenuItem value="name,asc">Name A-Z</MenuItem>
              <MenuItem value="price,asc">Price: Low to high</MenuItem>
              <MenuItem value="price,desc">Price: High to low</MenuItem>
              <MenuItem value="createdAt,desc">Newest</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {loading ? (
        <ProductGridSkeleton />
      ) : productsError ? (
        <EmptyState
          severity="error"
          icon={<Inventory2OutlinedIcon />}
          title="Products could not load"
          message={productsError}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Inventory2OutlinedIcon />}
          title="No products found"
          message="Try clearing filters, widening your price range, or checking another category."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch('');
            setPriceRange([0, PRICE_LIMIT]);
            setInStock(false);
            setMinRating('');
            setCategoryId('');
            setPage(0);
            navigate('/');
          }}
        />
      ) : (
        <>
          <Grid container spacing={2.5}>
            {products.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, p) => setPage(p - 1)}
                color="primary"
                size="medium"
                siblingCount={0}
                boundaryCount={1}
              />
            </Box>
          )}
        </>
      )}
    </PageContainer>
  );
}
