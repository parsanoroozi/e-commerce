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
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { categoriesApi } from '../../api/categories';
import { productsApi } from '../../api/products';
import { uploadsApi } from '../../api/uploads';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { resolveImageUrl } from '../../utils/imageUrl';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  sku: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  stockQuantity: '',
  imageUrl: '',
  categoryId: '',
  active: true,
  featured: false,
  visibleFrom: '',
  visibleUntil: '',
  imageDetails: [],
  variants: [],
};

const emptyAdjustment = { productId: '', variantId: '', quantityDelta: '', reason: '' };

function emptyVariant() {
  return { id: null, sku: '', size: '', color: '', material: '', stockQuantity: 0, active: true };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [productPageData, setProductPageData] = useState({ page: 0, totalPages: 0 });
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const [prodData, catData, historyData] = await Promise.all([
      productsApi.adminList(productPage, 20),
      categoriesApi.list(),
      adminApi.inventoryHistory(0, 8),
    ]);
    setProducts(prodData.content || prodData);
    setProductPageData(prodData.content ? prodData : { page: 0, totalPages: 0 });
    setCategories(catData);
    setHistory(historyData.content || []);
    setForm((current) => (
      catData.length && !current.categoryId
        ? { ...current, categoryId: String(catData[0].id) }
        : current
    ));
  }, [productPage]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const selectedAdjustmentProduct = products.find((p) => String(p.id) === String(adjustment.productId));
  const selectedAdjustmentVariants = selectedAdjustmentProduct?.variants?.filter((v) => v.active) || [];

  const payload = () => ({
    name: form.name,
    description: form.description,
    price: Number(form.price),
    sku: form.sku || null,
    slug: form.slug || null,
    metaTitle: form.metaTitle || null,
    metaDescription: form.metaDescription || null,
    stockQuantity: Number(form.stockQuantity || 0),
    imageUrl: form.imageUrl || null,
    categoryId: Number(form.categoryId),
    active: form.active,
    featured: form.featured,
    visibleFrom: form.visibleFrom ? new Date(form.visibleFrom).toISOString() : null,
    visibleUntil: form.visibleUntil ? new Date(form.visibleUntil).toISOString() : null,
    variants: form.variants.map((variant) => ({
      ...variant,
      stockQuantity: Number(variant.stockQuantity || 0),
    })),
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
      sku: p.sku || '',
      slug: p.slug || '',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      stockQuantity: String(p.stockQuantity),
      imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId),
      active: p.active,
      featured: Boolean(p.featured),
      visibleFrom: p.visibleFrom ? p.visibleFrom.slice(0, 16) : '',
      visibleUntil: p.visibleUntil ? p.visibleUntil.slice(0, 16) : '',
      imageDetails: (p.imageDetails || []).map((image) => ({ ...image })),
      variants: (p.variants || []).map((variant) => ({ ...variant })),
    });
  };

  const refreshEditedProduct = (updated) => {
    setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
    setForm((current) => ({
      ...current,
      imageUrl: updated.imageUrl || '',
      imageDetails: (updated.imageDetails || []).map((image) => ({ ...image })),
    }));
  };

  const updateVariant = (index, patch) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));
  };

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Upload a JPEG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadsApi.uploadProductImage(file);
      if (editingId) {
        const updated = await productsApi.addImage(editingId, {
          url,
          altText: form.name,
          sortOrder: form.imageDetails.length,
          primaryImage: form.imageDetails.length === 0,
        });
        refreshEditedProduct(updated);
      } else {
        setForm((f) => ({ ...f, imageUrl: url }));
      }
      setMessage('Image uploaded');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateImageAlt = async (image, altText) => {
    if (!editingId) return;
    try {
      const updated = await productsApi.updateImage(editingId, image.id, { altText });
      refreshEditedProduct(updated);
      setMessage('Image alt text updated');
    } catch (err) {
      setError(err.message);
    }
  };

  const setPrimaryImage = async (image) => {
    if (!editingId) return;
    try {
      const updated = await productsApi.updateImage(editingId, image.id, { primaryImage: true });
      refreshEditedProduct(updated);
      setMessage('Main product image replaced');
    } catch (err) {
      setError(err.message);
    }
  };

  const moveImage = async (image, direction) => {
    if (!editingId) return;
    const images = [...form.imageDetails].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = images.findIndex((entry) => entry.id === image.id);
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    try {
      const updated = await productsApi.reorderImages(editingId, images.map((entry, sortOrder) => ({
        id: entry.id,
        sortOrder,
      })));
      refreshEditedProduct(updated);
      setMessage('Images reordered');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteImage = async (image) => {
    if (!editingId) return;
    if (!(await confirm({
      title: 'Delete image?',
      description: 'This removes the image from the product and deletes the uploaded file when it is locally stored.',
      confirmText: 'Delete',
    }))) return;
    try {
      const updated = await productsApi.deleteImage(editingId, image.id);
      refreshEditedProduct(updated);
      setMessage('Image deleted');
    } catch (err) {
      setError(err.message);
    }
  };

  const adjustInventory = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminApi.adjustInventory({
        productId: Number(adjustment.productId),
        variantId: adjustment.variantId ? Number(adjustment.variantId) : null,
        quantityDelta: Number(adjustment.quantityDelta),
        reason: adjustment.reason,
      });
      setAdjustment(emptyAdjustment);
      setMessage('Inventory adjusted');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (id) => {
    if (!(await confirm({
      title: 'Deactivate product?',
      description: 'This product will no longer be available for purchase.',
      confirmText: 'Deactivate',
    }))) return;
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
              <TextField label={form.variants.length ? 'Total stock' : 'Stock'} required fullWidth type="number" inputProps={{ min: 0 }} disabled={form.variants.length > 0} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="SKU (optional)" fullWidth value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Slug" helperText="Used for SEO and clean product URLs." fullWidth value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={<Checkbox checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />}
                label="Featured product"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
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
                <Typography variant="subtitle2">Product images</Typography>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingId ? 'Upload product image' : 'Upload main image'}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                </Button>
                {form.imageUrl && (
                  <Box component="img" src={resolveImageUrl(form.imageUrl)} alt="Preview" sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 2 }} />
                )}
                <TextField label="Main image URL" fullWidth size="small" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                {editingId && (
                  <Stack spacing={1}>
                    {form.imageDetails.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No gallery images yet.</Typography>
                    )}
                    {[...form.imageDetails].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => (
                      <Card key={image.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid size={{ xs: 12, sm: 2 }}>
                            <Box component="img" src={resolveImageUrl(image.url)} alt={image.altText || form.name} sx={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 1 }} />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Alt text"
                              fullWidth
                              size="small"
                              defaultValue={image.altText || ''}
                              onBlur={(e) => updateImageAlt(image, e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Button size="small" onClick={() => moveImage(image, -1)}>Up</Button>
                              <Button size="small" onClick={() => moveImage(image, 1)}>Down</Button>
                              <Button size="small" variant={image.primaryImage ? 'contained' : 'outlined'} onClick={() => setPrimaryImage(image)}>
                                {image.primaryImage ? 'Main image' : 'Make main'}
                              </Button>
                              <Button size="small" color="error" onClick={() => deleteImage(image)}>Delete</Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>
            <Grid size={12}>
              <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Meta title" fullWidth value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Meta description" fullWidth value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Visible from"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.visibleFrom}
                onChange={(e) => setForm({ ...form, visibleFrom: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Visible until"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.visibleUntil}
                onChange={(e) => setForm({ ...form, visibleUntil: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>Variants</Typography>
                <Button type="button" size="small" variant="outlined" onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, emptyVariant()] }))}>
                  Add variant
                </Button>
              </Stack>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {form.variants.map((variant, index) => (
                  <Card key={variant.id || index} variant="outlined" sx={{ p: 1.5 }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 2 }}><TextField label="Size" fullWidth size="small" value={variant.size || ''} onChange={(e) => updateVariant(index, { size: e.target.value })} /></Grid>
                      <Grid size={{ xs: 12, sm: 2 }}><TextField label="Color" fullWidth size="small" value={variant.color || ''} onChange={(e) => updateVariant(index, { color: e.target.value })} /></Grid>
                      <Grid size={{ xs: 12, sm: 2 }}><TextField label="Material" fullWidth size="small" value={variant.material || ''} onChange={(e) => updateVariant(index, { material: e.target.value })} /></Grid>
                      <Grid size={{ xs: 12, sm: 2 }}><TextField label="SKU" fullWidth size="small" value={variant.sku || ''} onChange={(e) => updateVariant(index, { sku: e.target.value })} /></Grid>
                      <Grid size={{ xs: 12, sm: 2 }}><TextField label="Stock" fullWidth size="small" type="number" inputProps={{ min: 0 }} value={variant.stockQuantity ?? 0} onChange={(e) => updateVariant(index, { stockQuantity: e.target.value })} /></Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <FormControlLabel control={<Checkbox checked={variant.active !== false} onChange={(e) => updateVariant(index, { active: e.target.checked })} />} label="Active" />
                          <Button type="button" size="small" color="error" onClick={() => removeVariant(index)}>Remove</Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
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

      <Card component="form" onSubmit={adjustInventory} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Manual stock adjustment</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Product</InputLabel>
                <Select required value={adjustment.productId} label="Product" onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value, variantId: '' })}>
                  {products.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small" disabled={!selectedAdjustmentVariants.length}>
                <InputLabel>Variant</InputLabel>
                <Select value={adjustment.variantId} label="Variant" onChange={(e) => setAdjustment({ ...adjustment, variantId: e.target.value })}>
                  <MenuItem value="">Base product</MenuItem>
                  {selectedAdjustmentVariants.map((variant) => (
                    <MenuItem key={variant.id} value={String(variant.id)}>{variant.displayName || variant.sku || `Variant #${variant.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField required label="Change" fullWidth size="small" type="number" value={adjustment.quantityDelta} onChange={(e) => setAdjustment({ ...adjustment, quantityDelta: e.target.value })} helperText="Use + or -" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField required label="Reason" fullWidth size="small" value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <Button type="submit" variant="contained">Apply adjustment</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Card} sx={{ overflowX: 'auto', mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Variants</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Visibility</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.sku || '-'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.categoryName}</TableCell>
                <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>{p.stockQuantity}</TableCell>
                <TableCell>{p.variants?.length || 0}</TableCell>
                <TableCell>{p.featured ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {p.visibleFrom ? `From ${new Date(p.visibleFrom).toLocaleDateString()}` : 'Now'}
                  {p.visibleUntil ? ` to ${new Date(p.visibleUntil).toLocaleDateString()}` : ''}
                </TableCell>
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
        <Stack alignItems="center" sx={{ mt: 3, mb: 3 }}>
          <Pagination
            count={productPageData.totalPages}
            page={productPage + 1}
            onChange={(_, value) => setProductPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent stock adjustments</Typography>
          <Stack spacing={1}>
            {history.length === 0 && <Typography color="text.secondary">No adjustments yet.</Typography>}
            {history.map((entry) => (
              <Box key={entry.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {entry.productName}{entry.variantName ? ` - ${entry.variantName}` : ''}: {entry.quantityDelta > 0 ? '+' : ''}{entry.quantityDelta}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${entry.stockBefore} -> ${entry.stockAfter} | ${entry.reason} | ${entry.adminEmail || 'admin'}`}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
