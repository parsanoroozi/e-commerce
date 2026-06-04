import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
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
import { useConfirm } from '../../context/ConfirmDialogContext';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [parentId, setParentId] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [taxRate, setTaxRate] = useState('');
  const [variantAttributes, setVariantAttributes] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const confirm = useConfirm();

  const load = () => categoriesApi.list().then(setCategories);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = {
        name,
        description,
        displayOrder: Number(displayOrder || 0),
        parentId: parentId ? Number(parentId) : null,
        lowStockThreshold: Number(lowStockThreshold || 10),
        taxRate: taxRate === '' ? null : Number(taxRate),
        variantOptions: buildVariantOptions(variantAttributes),
      };
      if (editingId) await categoriesApi.update(editingId, data);
      else await categoriesApi.create(data);
      resetForm();
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || '');
    setDisplayOrder(String(c.displayOrder ?? 0));
    setParentId(c.parentId ? String(c.parentId) : '');
    setLowStockThreshold(String(c.lowStockThreshold ?? 10));
    setTaxRate(c.taxRate == null ? '' : String(c.taxRate));
    setVariantAttributes(optionsToText(c.variantOptions));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setDisplayOrder('0');
    setParentId('');
    setLowStockThreshold('10');
    setTaxRate('');
    setVariantAttributes('');
  };

  const remove = async (id) => {
    if (!(await confirm({
      title: 'Delete category?',
      description: 'Products in this category may be affected by this change.',
      confirmText: 'Delete',
    }))) return;
    try {
      await categoriesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Manage categories</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap">
            <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ flex: 2, minWidth: { xs: '100%', sm: 200 } }} />
            <TextField label="Order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} sx={{ width: { xs: '100%', sm: 120 } }} />
            <TextField label="Low stock threshold" type="number" inputProps={{ min: 1 }} value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} sx={{ width: { xs: '100%', sm: 180 } }} />
            <TextField label="Category tax rate" type="number" inputProps={{ step: 0.0001, min: 0 }} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} sx={{ width: { xs: '100%', sm: 160 } }} />
            <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel>Parent</InputLabel>
              <Select label="Parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {categories.filter((c) => c.id !== editingId).map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Variant attributes"
              helperText="Comma-separated, e.g. Color, Weight, Battery"
              value={variantAttributes}
              onChange={(e) => setVariantAttributes(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 280 }, flex: 1 }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button type="submit" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
              {editingId && (
                <Button type="button" variant="outlined" onClick={() => { setEditingId(null); resetForm(); }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {categories.map((c) => (
          <Card key={c.id}>
            <CardContent>
              <Stack spacing={1.25}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.parentName || 'Top-level category'}
                    </Typography>
                  </Box>
                  <Chip size="small" label={`Min ${c.lowStockThreshold}`} />
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Chip size="small" variant="outlined" label={`Order ${c.displayOrder}`} />
                  <Chip size="small" variant="outlined" label={c.taxRate == null ? 'Default tax' : `Tax ${c.taxRate}`} />
                </Stack>
                {(c.variantOptions || []).length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(c.variantOptions || []).map((option, index) => (
                      <Chip key={`${option.name}-${index}`} size="small" label={option.name} />
                    ))}
                  </Stack>
                )}
                {c.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {c.description}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => startEdit(c)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => remove(c.id)}>Delete</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <TableContainer component={Card} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Threshold</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Variant attributes</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.parentId ? `  ${c.name}` : c.name}</TableCell>
                <TableCell>{c.parentName || '-'}</TableCell>
                <TableCell>{c.displayOrder}</TableCell>
                <TableCell>{c.lowStockThreshold}</TableCell>
                <TableCell>{c.taxRate == null ? '-' : c.taxRate}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(c.variantOptions || []).map((option, index) => (
                      <Chip key={`${option.name}-${index}`} size="small" label={option.name} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => startEdit(c)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function buildVariantOptions(text) {
  return text.split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, displayOrder) => ({ name, displayOrder }));
}

function optionsToText(options = []) {
  return options
    .map((option) => option.name)
    .join(', ');
}
