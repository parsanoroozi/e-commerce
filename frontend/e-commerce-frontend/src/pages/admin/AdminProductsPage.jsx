import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
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

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Product name is required.';
    if (!form.categoryId) nextErrors.categoryId = 'Choose a category.';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Enter a price greater than zero.';
    if (!form.variants.length && (form.stockQuantity === '' || Number(form.stockQuantity) < 0)) {
      nextErrors.stockQuantity = 'Enter stock quantity zero or higher.';
    }
    form.variants.forEach((variant, index) => {
      if (Number(variant.stockQuantity) < 0) {
        nextErrors[`variant-${index}-stock`] = 'Stock cannot be negative.';
      }
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const payload = (activeOverride = form.active) => ({
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
    active: activeOverride,
    featured: form.featured,
    visibleFrom: form.visibleFrom ? new Date(form.visibleFrom).toISOString() : null,
    visibleUntil: form.visibleUntil ? new Date(form.visibleUntil).toISOString() : null,
    variants: form.variants.map((variant) => ({
      ...variant,
      stockQuantity: Number(variant.stockQuantity || 0),
    })),
  });

  const saveProduct = async (activeOverride) => {
    setError('');
    setMessage('');
    if (!validateForm()) {
      setError('Fix the highlighted product fields before saving.');
      return;
    }
    try {
      if (editingId) {
        await productsApi.update(editingId, payload(activeOverride));
        setMessage(activeOverride ? 'Product published' : 'Product saved as draft');
      } else {
        await productsApi.create(payload(activeOverride));
        setMessage(activeOverride ? 'Product published' : 'Product draft saved');
      }
      setForm(emptyProduct);
      setFieldErrors({});
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !needle
        || product.name.toLowerCase().includes(needle)
        || (product.sku || '').toLowerCase().includes(needle)
        || (product.categoryName || '').toLowerCase().includes(needle);
      const matchesStatus = productStatusFilter === 'ALL'
        || (productStatusFilter === 'PUBLISHED' && product.active)
        || (productStatusFilter === 'DRAFT' && !product.active)
        || (productStatusFilter === 'LOW_STOCK' && Number(product.stockQuantity) <= 5);
      const matchesCategory = categoryFilter === 'ALL' || String(product.categoryId) === String(categoryFilter);
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, productSearch, productStatusFilter, products]);

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{editingId ? 'Edit product' : 'Add product'}</Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={700}>Basic info</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
                required
                fullWidth
                value={form.name}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
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
            <Grid size={12}>
              <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Category</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormControl fullWidth size="small" error={Boolean(fieldErrors.categoryId)}>
                <InputLabel>Category</InputLabel>
                <Select required value={form.categoryId} label="Category" onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
                {fieldErrors.categoryId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {fieldErrors.categoryId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid size={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Pricing</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Price"
                required
                fullWidth
                type="number"
                inputProps={{ step: 0.01, min: 0.01 }}
                value={form.price}
                error={Boolean(fieldErrors.price)}
                helperText={fieldErrors.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Grid>
            <Grid size={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Images</Typography>
            </Grid>
            <Grid size={12}>
              <Stack spacing={1}>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingId ? 'Upload product image' : 'Upload main image'}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                </Button>
                {(form.imageUrl || form.imageDetails.length > 0) && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {form.imageUrl && (
                      <Box component="img" src={resolveImageUrl(form.imageUrl)} alt="Main preview" sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1 }} />
                    )}
                    {[...form.imageDetails].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => (
                      <Box key={image.id} component="img" src={resolveImageUrl(image.url)} alt={image.altText || form.name} sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1, border: image.primaryImage ? '2px solid' : '1px solid', borderColor: image.primaryImage ? 'primary.main' : 'divider' }} />
                    ))}
                  </Stack>
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
            <Grid size={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Inventory</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label={form.variants.length ? 'Total stock' : 'Stock'}
                required
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                disabled={form.variants.length > 0}
                value={form.stockQuantity}
                error={Boolean(fieldErrors.stockQuantity)}
                helperText={fieldErrors.stockQuantity || (form.variants.length ? 'Calculated from variants.' : '')}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>Variants</Typography>
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
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          label="Stock"
                          fullWidth
                          size="small"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={variant.stockQuantity ?? 0}
                          error={Boolean(fieldErrors[`variant-${index}-stock`])}
                          helperText={fieldErrors[`variant-${index}-stock`]}
                          onChange={(e) => updateVariant(index, { stockQuantity: e.target.value })}
                        />
                      </Grid>
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
            <Grid size={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Publishing</Typography>
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
              <FormControlLabel
                control={<Checkbox checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
                label="Published"
              />
            </Grid>
          </Grid>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <Button type="button" variant="outlined" onClick={() => saveProduct(false)} sx={{ minHeight: 44 }}>Save draft</Button>
            <Button type="button" variant="contained" onClick={() => saveProduct(true)} sx={{ minHeight: 44 }}>{editingId ? 'Publish changes' : 'Publish'}</Button>
            {editingId && (
              <Button type="button" variant="outlined" onClick={() => { setEditingId(null); setForm(emptyProduct); setFieldErrors({}); }} sx={{ minHeight: 44 }}>
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

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Product table</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search product, SKU, or category"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All statuses</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="DRAFT">Drafts</MenuItem>
                  <MenuItem value="LOW_STOCK">Low stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="ALL">All categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isSmall ? (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {filteredProducts.map((p) => (
            <Card key={p.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  {p.imageUrl && (
                    <Box
                      component="img"
                      src={resolveImageUrl(p.imageUrl)}
                      alt={p.name}
                      sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={800}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.sku || 'No SKU'} - {p.categoryName || 'Uncategorized'}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip size="small" label={`$${Number(p.price).toFixed(2)}`} />
                      <Chip size="small" label={`${p.stockQuantity} in stock`} color={Number(p.stockQuantity) <= 5 ? 'warning' : 'default'} />
                      <Chip size="small" label={p.active ? 'Published' : 'Draft'} color={p.active ? 'success' : 'default'} />
                      {p.featured && <Chip size="small" label="Featured" color="primary" variant="outlined" />}
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button fullWidth variant="contained" sx={{ minHeight: 44 }} onClick={() => startEdit(p)}>Edit</Button>
                  <Button fullWidth variant="outlined" color="warning" sx={{ minHeight: 44 }} onClick={() => deactivate(p.id)}>
                    Deactivate
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                  No products match the current filters.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      ) : (
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
              {filteredProducts.map((p) => (
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
                    <Button size="small" sx={{ minHeight: 40 }} onClick={() => startEdit(p)}>Edit</Button>
                    <Button size="small" sx={{ minHeight: 40 }} color="warning" onClick={() => deactivate(p.id)}>Deactivate</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No products match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
