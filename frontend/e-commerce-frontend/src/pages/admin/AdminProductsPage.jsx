import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { categoriesApi } from '../../api/categories';
import { productsApi } from '../../api/products';
import { uploadsApi } from '../../api/uploads';
import { resolveImageUrl } from '../../utils/imageUrl';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  imageUrl: '',
  categoryId: '',
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [productPageData, setProductPageData] = useState({ page: 0, totalPages: 0 });
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [prodData, catData] = await Promise.all([
      productsApi.adminList(productPage, 20),
      categoriesApi.list(),
    ]);
    setProducts(prodData.content || prodData);
    setProductPageData(prodData.content ? prodData : { page: 0, totalPages: 0 });
    setCategories(catData);
    if (catData.length && !form.categoryId) {
      setForm((f) => ({ ...f, categoryId: String(catData[0].id) }));
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [productPage]);

  const payload = () => ({
    name: form.name,
    description: form.description,
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
    imageUrl: form.imageUrl || null,
    categoryId: Number(form.categoryId),
    active: form.active,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await productsApi.update(editingId, payload());
        setMessage('Product updated');
      } else {
        await productsApi.create(payload());
        setMessage('Product created');
      }
      setForm(emptyProduct);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId),
      active: p.active,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadsApi.uploadProductImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      setMessage('Image uploaded');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await productsApi.remove(id);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Manage products</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{editingId ? 'Edit product' : 'Add product'}</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Name" required fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Price" required fullWidth type="number" inputProps={{ step: 0.01, min: 0.01 }} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Stock" required fullWidth type="number" inputProps={{ min: 0 }} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select required value={form.categoryId} label="Category" onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Product image</Typography>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload image'}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} />
                </Button>
                {form.imageUrl && (
                  <Box component="img" src={resolveImageUrl(form.imageUrl)} alt="Preview" sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 2 }} />
                )}
                <TextField label="Or paste image URL" fullWidth size="small" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </Stack>
            </Grid>
            <Grid size={12}>
              <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={<Checkbox checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
                label="Active"
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
            {editingId && (
              <Button type="button" variant="outlined" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>
                Cancel
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.categoryName}</TableCell>
                <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>{p.stockQuantity}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{p.active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => startEdit(p)}>Edit</Button>
                  <Button size="small" color="warning" onClick={() => deactivate(p.id)}>Deactivate</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {productPageData.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={productPageData.totalPages}
            page={productPage + 1}
            onChange={(_, value) => setProductPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}
    </Box>
  );
}
