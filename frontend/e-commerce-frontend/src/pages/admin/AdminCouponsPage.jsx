import {
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
import { couponsApi } from '../../api/coupons';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { showError, showSuccess } from '../../utils/toast';

const empty = {
  id: null,
  code: '',
  type: 'percent',
  value: '10',
  minOrderAmount: '50',
  expiresAt: '',
  usageLimit: '',
  perUserUsageLimit: '',
  productIds: '',
  categoryIds: '',
  freeShipping: false,
  active: true,
};

const parseIds = (value) =>
  value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isInteger);

const toLocalDateTime = (value) => (value ? value.slice(0, 16) : '');

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const confirm = useConfirm();

  const load = () =>
    couponsApi.adminList().then(setCoupons).catch((err) => showError(err.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      minOrderAmount: form.minOrderAmount === '' ? null : Number(form.minOrderAmount),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      perUserUsageLimit: form.perUserUsageLimit === '' ? null : Number(form.perUserUsageLimit),
      productIds: parseIds(form.productIds),
      categoryIds: parseIds(form.categoryIds),
      freeShipping: form.freeShipping,
      active: form.active,
      discountPercent: form.type === 'percent' ? Number(form.value) : null,
      discountAmount: form.type === 'fixed' ? Number(form.value) : null,
    };

    if (form.type === 'shipping') {
      payload.discountPercent = null;
      payload.discountAmount = null;
      payload.freeShipping = true;
    }

    try {
      if (form.id) {
        await couponsApi.update(form.id, payload);
        showSuccess('Coupon updated');
      } else {
        await couponsApi.create(payload);
        showSuccess('Coupon created');
      }
      setForm(empty);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const edit = (coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code || '',
      type: coupon.freeShipping && coupon.discountPercent == null && coupon.discountAmount == null
        ? 'shipping'
        : coupon.discountAmount != null ? 'fixed' : 'percent',
      value: String(coupon.discountPercent ?? coupon.discountAmount ?? 0),
      minOrderAmount: coupon.minOrderAmount == null ? '' : String(coupon.minOrderAmount),
      expiresAt: toLocalDateTime(coupon.expiresAt),
      usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
      perUserUsageLimit: coupon.perUserUsageLimit == null ? '' : String(coupon.perUserUsageLimit),
      productIds: (coupon.productIds || []).join(', '),
      categoryIds: (coupon.categoryIds || []).join(', '),
      freeShipping: Boolean(coupon.freeShipping),
      active: Boolean(coupon.active),
    });
  };

  const remove = async (id) => {
    if (!(await confirm({
      title: 'Delete coupon?',
      description: 'Customers will no longer be able to use this coupon.',
      confirmText: 'Delete',
    }))) return;
    try {
      await couponsApi.remove(id);
      showSuccess('Coupon deleted');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const formatDiscount = (coupon) => {
    const parts = [];
    if (coupon.discountPercent != null) parts.push(`${coupon.discountPercent}% off`);
    if (coupon.discountAmount != null) parts.push(`$${Number(coupon.discountAmount).toFixed(2)} off`);
    if (coupon.freeShipping) parts.push('Free shipping');
    return parts.length ? parts.join(' + ') : '-';
  };

  const formatTargeting = (coupon) => {
    const parts = [];
    if (coupon.productIds?.length) parts.push(`${coupon.productIds.length} products`);
    if (coupon.categoryIds?.length) parts.push(`${coupon.categoryIds.length} categories`);
    return parts.length ? parts.join(', ') : 'All products';
  };

  const formatExpiry = (value) => value ? new Date(value).toLocaleString() : 'No expiry';

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Coupons</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure discount rules, limits, targeting, free shipping, and track coupon performance.
      </Typography>

      <Card component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Code" required fullWidth value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="percent">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed amount</MenuItem>
                  <MenuItem value="shipping">Free shipping only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Value"
                type="number"
                required={form.type !== 'shipping'}
                disabled={form.type === 'shipping'}
                fullWidth
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Min order ($)" type="number" fullWidth value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Expiration"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Total usage limit" type="number" fullWidth value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Per-user limit" type="number" fullWidth value={form.perUserUsageLimit} onChange={(e) => setForm({ ...form, perUserUsageLimit: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel control={<Checkbox checked={form.freeShipping} onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })} />} label="Free shipping" />
                <FormControlLabel control={<Checkbox checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />} label="Active" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Product IDs" helperText="Comma-separated product IDs; blank applies to all products." fullWidth value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Category IDs" helperText="Comma-separated category IDs; blank applies to all categories." fullWidth value={form.categoryIds} onChange={(e) => setForm({ ...form, categoryIds: e.target.value })} />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained">{form.id ? 'Update coupon' : 'Create coupon'}</Button>
            {form.id && <Button type="button" onClick={() => setForm(empty)}>Cancel edit</Button>}
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Limits</TableCell>
              <TableCell>Targeting</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Performance</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell><strong>{coupon.code}</strong></TableCell>
                <TableCell>{formatDiscount(coupon)}</TableCell>
                <TableCell>
                  {coupon.usageLimit ? `${coupon.usageCount || 0}/${coupon.usageLimit} total` : `${coupon.usageCount || 0} used`}
                  <br />
                  {coupon.perUserUsageLimit ? `${coupon.perUserUsageLimit} per customer` : 'No per-user cap'}
                </TableCell>
                <TableCell>{formatTargeting(coupon)}</TableCell>
                <TableCell>{formatExpiry(coupon.expiresAt)}</TableCell>
                <TableCell>
                  {coupon.uniqueCustomerCount || 0} customers
                  <br />
                  ${Number(coupon.revenueAttributed || 0).toFixed(2)} revenue
                </TableCell>
                <TableCell>{coupon.active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => edit(coupon)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => remove(coupon.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
