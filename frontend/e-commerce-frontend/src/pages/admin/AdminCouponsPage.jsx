import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
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
  code: '',
  type: 'percent',
  value: '10',
  minOrderAmount: '50',
  active: true,
};

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
      minOrderAmount: Number(form.minOrderAmount),
      active: form.active,
      discountPercent: form.type === 'percent' ? Number(form.value) : null,
      discountAmount: form.type === 'fixed' ? Number(form.value) : null,
    };
    try {
      await couponsApi.create(payload);
      showSuccess('Coupon created');
      setForm(empty);
      load();
    } catch (err) {
      showError(err.message);
    }
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

  const formatDiscount = (c) => {
    if (c.discountPercent != null) return `${c.discountPercent}% off`;
    if (c.discountAmount != null) return `$${Number(c.discountAmount).toFixed(2)} off`;
    return '—';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Coupons</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Demo: SAVE10 (10% off, min $50), WELCOME5 ($5 off, min $25)
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
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Value" type="number" required fullWidth value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Min order ($)" type="number" fullWidth value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create coupon</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Min order</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell><strong>{c.code}</strong></TableCell>
                <TableCell>{formatDiscount(c)}</TableCell>
                <TableCell>${Number(c.minOrderAmount || 0).toFixed(2)}</TableCell>
                <TableCell>{c.active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
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
