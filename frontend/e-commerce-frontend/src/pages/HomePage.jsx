import {
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import { storefrontApi } from '../api/storefront';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError } from '../utils/toast';

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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('name,asc');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
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
  }, [categoryId, debouncedSearch, inStock, maxPrice, minPrice, minRating, page, reloadKey, sort]);

  return (
    <PageContainer>
      <Card
        sx={{
          mb: 3,
          p: { xs: 2, md: 4 },
          background: (t) =>
            settings?.homepageBannerImageUrl
              ? `linear-gradient(90deg, ${t.palette.background.paper}f2, ${t.palette.background.paper}99), url(${settings.homepageBannerImageUrl}) center/cover`
              : t.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${t.palette.secondary.dark}55, ${t.palette.primary.main}24)`
                : `linear-gradient(135deg, ${t.palette.secondary.light}55, ${t.palette.primary.light}2f)`,
        }}
      >
        <Typography variant="overline" color="secondary.main" fontWeight={600}>
          {settings?.brandName || 'ShopVerse'}
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 0.5, mb: 1 }}>
          {settings?.homepageBannerTitle || 'Discover products you\'ll love'}
        </Typography>
        <Typography color="text.secondary" maxWidth={520}>
          {settings?.homepageBannerSubtitle || 'Curated quality with fast checkout and secure payments.'}
        </Typography>
        {settings?.homepageBannerCtaText && (
          <Button variant="contained" href={settings.homepageBannerCtaUrl || '#featured'} sx={{ mt: 2 }}>
            {settings.homepageBannerCtaText}
          </Button>
        )}
      </Card>

      {featured.length > 0 && (
        <Box id="featured" sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>Featured products</Typography>
          <Grid container spacing={2}>
            {featured.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Card sx={{ mb: 3, p: { xs: 2, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products..."
            value={search}
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
          <TextField
            size="small"
            label="Min price"
            type="number"
            value={minPrice}
            inputProps={{ min: 0, step: 1 }}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 130 } }}
          />
          <TextField
            size="small"
            label="Max price"
            type="number"
            value={maxPrice}
            inputProps={{ min: 0, step: 1 }}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 130 } }}
          />
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
              <MenuItem value="name,asc">Name A–Z</MenuItem>
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
            setMinPrice('');
            setMaxPrice('');
            setInStock(false);
            setMinRating('');
            setCategoryId('');
            setPage(0);
            navigate('/');
          }}
        />
      ) : (
        <>
          <Grid container spacing={2}>
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
