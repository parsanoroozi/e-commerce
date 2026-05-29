import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cartApi } from '../api/cart';
import PageContainer from '../components/layout/PageContainer';
import { resolveImageUrl } from '../utils/imageUrl';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCart = () => {
    setLoading(true);
    cartApi
      .get()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      const updated = await cartApi.updateItem(productId, { productId, quantity });
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (productId) => {
    try {
      const updated = await cartApi.removeItem(productId);
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Your cart
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!cart?.items?.length ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>Your cart is empty.</Typography>
          <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
            Continue shopping
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              {cart.items.map((item) => (
                <Card key={item.productId} sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <Box
                      component="img"
                      src={resolveImageUrl(item.imageUrl)}
                      alt=""
                      sx={{ width: { xs: '100%', sm: 88 }, height: 88, objectFit: 'cover', borderRadius: 2 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{item.productName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${Number(item.unitPrice).toFixed(2)} each
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                        <IconButton size="small" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                    <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={1}>
                      <Typography variant="h6" color="primary">
                        ${Number(item.lineTotal).toFixed(2)}
                      </Typography>
                      <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => remove(item.productId)}>
                        Remove
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 88 } }}>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Typography color="text.secondary">{cart.totalItems} items</Typography>
              <Typography variant="h5" color="primary" sx={{ my: 2 }}>
                ${Number(cart.totalAmount).toFixed(2)}
              </Typography>
              <Button component={RouterLink} to="/checkout" variant="contained" fullWidth size="large">
                Proceed to checkout
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}
    </PageContainer>
  );
}
