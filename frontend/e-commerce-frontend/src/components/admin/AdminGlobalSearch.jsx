import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Box,
  CircularProgress,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ordersApi } from '../../api/orders';
import { productsApi } from '../../api/products';

const emptyResults = { products: [], orders: [], customers: [] };

export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyResults);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults(emptyResults);
      setOpen(false);
      return undefined;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [productData, orderData, userData] = await Promise.all([
          productsApi.adminList(0, 20),
          ordersApi.adminAll(0),
          adminApi.users(0, 20),
        ]);
        if (cancelled) return;
        const needle = trimmed.toLowerCase();
        const products = (productData.content || productData || [])
          .filter((product) => [
            product.name,
            product.sku,
            product.categoryName,
          ].some((value) => String(value || '').toLowerCase().includes(needle)))
          .slice(0, 4);
        const orders = (orderData.content || [])
          .filter((order) => {
            const customer = order.customer ? `${order.customer.firstName} ${order.customer.lastName} ${order.customer.email}` : '';
            return String(order.id).includes(needle) || customer.toLowerCase().includes(needle);
          })
          .slice(0, 4);
        const customers = (userData.content || [])
          .filter((customer) => [
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.mobileNumber,
          ].some((value) => String(value || '').toLowerCase().includes(needle)))
          .slice(0, 4);
        setResults({ products, orders, customers });
        setOpen(true);
      } catch {
        setResults(emptyResults);
        setOpen(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [trimmed]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const hasResults = useMemo(() => (
    results.products.length || results.orders.length || results.customers.length
  ), [results]);

  const go = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
      <TextField
        size="small"
        placeholder="Search orders, products, customers"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => trimmed.length >= 2 && setOpen(true)}
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={16} />
              </InputAdornment>
            ) : null,
          },
        }}
      />
      {open && trimmed.length >= 2 && (
        <Paper
          variant="outlined"
          sx={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 420,
            overflowY: 'auto',
            p: 0.75,
            boxShadow: '0 18px 48px rgba(24, 24, 24, 0.12)',
          }}
        >
          {!hasResults && !loading && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1.25, py: 1.5 }}>
              No admin results found.
            </Typography>
          )}
          <ResultGroup title="Orders">
            {results.orders.map((order) => (
              <SearchResult
                key={`order-${order.id}`}
                primary={`Order #${order.id}`}
                secondary={`${order.status} / $${Number(order.totalAmount || 0).toFixed(2)}`}
                onClick={() => go(`/admin/orders/${order.id}`)}
              />
            ))}
          </ResultGroup>
          <ResultGroup title="Products">
            {results.products.map((product) => (
              <SearchResult
                key={`product-${product.id}`}
                primary={product.name}
                secondary={`${product.sku || 'No SKU'} / ${product.categoryName || 'Uncategorized'}`}
                onClick={() => go(`/admin/products?search=${encodeURIComponent(product.name)}`)}
              />
            ))}
          </ResultGroup>
          <ResultGroup title="Customers">
            {results.customers.map((customer) => (
              <SearchResult
                key={`customer-${customer.id}`}
                primary={`${customer.firstName} ${customer.lastName}`}
                secondary={customer.email}
                onClick={() => go(`/admin/users?search=${encodeURIComponent(customer.email)}`)}
              />
            ))}
          </ResultGroup>
        </Paper>
      )}
    </Box>
  );
}

function ResultGroup({ children, title }) {
  if (!children?.length) return null;
  return (
    <Stack spacing={0.25} sx={{ py: 0.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ px: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function SearchResult({ primary, secondary, onClick }) {
  return (
    <ListItemButton onClick={onClick} sx={{ borderRadius: 1.25 }}>
      <ListItemText
        primary={primary}
        secondary={secondary}
        slotProps={{
          primary: { noWrap: true, fontWeight: 800 },
          secondary: { noWrap: true },
        }}
      />
    </ListItemButton>
  );
}
