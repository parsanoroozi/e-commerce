import {
  Box,
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
import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
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
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name,asc');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const [sortField, sortDir] = sort.split(',');
    productsApi
      .list({
        categoryId: categoryId || undefined,
        search: debouncedSearch || undefined,
        page,
        size: 12,
        sort: `${sortField},${sortDir}`,
      }, { signal: controller.signal })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') showError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [categoryId, debouncedSearch, page, sort]);

  return (
    <PageContainer>
      <Card
        sx={{
          mb: 3,
          p: { xs: 2, md: 4 },
          background: (t) =>
            t.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${t.palette.secondary.dark}55, ${t.palette.primary.main}24)`
              : `linear-gradient(135deg, ${t.palette.secondary.light}55, ${t.palette.primary.light}2f)`,
        }}
      >
        <Typography variant="overline" color="secondary.main" fontWeight={600}>
          New season collection
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 0.5, mb: 1 }}>
          Discover products you&apos;ll love
        </Typography>
        <Typography color="text.secondary" maxWidth={520}>
          Curated quality with fast checkout and secure payments.
        </Typography>
      </Card>

      <Card sx={{ mb: 3, p: { xs: 2, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
              setCategoryId(e.target.value);
              setPage(0);
            }}>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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
      ) : products.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No products found</Typography>
          <Typography color="text.secondary">Try a different search or category.</Typography>
        </Card>
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
