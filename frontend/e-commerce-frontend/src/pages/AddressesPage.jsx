import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { shippingAddressesApi } from '../api/shippingAddresses';
import PageContainer from '../components/layout/PageContainer';

const emptyForm = {
  label: '',
  street: '',
  city: '',
  zipCode: '',
  country: '',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    shippingAddressesApi.list().then(setAddresses).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await shippingAddressesApi.update(editingId, form);
        setMessage('Address updated');
      } else {
        await shippingAddressesApi.create(form);
        setMessage('Address saved');
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await shippingAddressesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const makeDefault = async (id) => {
    try {
      await shippingAddressesApi.setDefault(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Button component={RouterLink} to="/checkout" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to checkout
      </Button>
      <Typography variant="h4" gutterBottom>Saved addresses</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{editingId ? 'Edit address' : 'Add address'}</Typography>
          <Stack spacing={2}>
            <TextField label="Label (optional)" placeholder="Home, Work..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <TextField label="Street" required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <TextField label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="ZIP" required value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            <TextField label="Country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <FormControlLabel
              control={<Checkbox checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />}
              label="Set as default"
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">{editingId ? 'Update' : 'Save'}</Button>
              {editingId && (
                <Button type="button" variant="outlined" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {addresses.map((addr) => (
          <Card key={addr.id} variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography fontWeight={600}>
                  {addr.label || 'Address'}
                  {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.street}, {addr.city}, {addr.zipCode}, {addr.country}
                </Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" spacing={1}>
                {!addr.isDefault && (
                  <Button size="small" variant="outlined" onClick={() => makeDefault(addr.id)}>Make default</Button>
                )}
                <Button size="small" variant="outlined" onClick={() => startEdit(addr)}>Edit</Button>
                <Button size="small" color="error" onClick={() => remove(addr.id)}>Delete</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      {addresses.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No saved addresses yet. Add one above or at checkout.
        </Typography>
      )}
    </PageContainer>
  );
}
