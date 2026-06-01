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
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { shippingAddressesApi } from '../api/shippingAddresses';
import AddressFormFields from '../components/AddressFormFields';
import PageContainer from '../components/layout/PageContainer';
import { useConfirm } from '../context/ConfirmDialogContext';
import { formatAddressLine, validatePostalCode } from '../utils/address';

const emptyForm = {
  label: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  latitude: '',
  longitude: '',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const confirm = useConfirm();

  const load = useCallback(() =>
    shippingAddressesApi.list(page).then((data) => {
      setAddresses(data.content);
      setPageData(data);
    }).catch((err) => setError(err.message)), [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const nextErrors = validateAddressForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Fix the highlighted address fields before saving.');
      return;
    }
    try {
      if (editingId) {
        await shippingAddressesApi.update(editingId, normalizeAddressPayload(form));
        setMessage('Address updated');
      } else {
        await shippingAddressesApi.create(normalizeAddressPayload(form));
        setMessage('Address saved');
      }
      setForm(emptyForm);
      setFieldErrors({});
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
      state: addr.state || '',
      zipCode: addr.zipCode,
      country: addr.country,
      latitude: addr.latitude ?? '',
      longitude: addr.longitude ?? '',
      isDefault: addr.isDefault,
    });
  };

  const remove = async (id) => {
    if (!(await confirm({
      title: 'Delete address?',
      description: 'This address will be removed from your saved addresses.',
      confirmText: 'Delete',
    }))) return;
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
            <AddressFormFields form={form} setForm={setForm} errors={fieldErrors} />
            <FormControlLabel
              control={<Checkbox checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />}
              label="Set as default"
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">{editingId ? 'Update' : 'Save'}</Button>
              {editingId && (
                <Button type="button" variant="outlined" onClick={() => { setEditingId(null); setForm(emptyForm); setFieldErrors({}); }}>
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
                <Typography variant="body2" color="text.secondary">{formatAddressLine(addr)}</Typography>
                {addr.latitude != null && addr.longitude != null && (
                  <Typography variant="body2" color="text.secondary">
                    Map: {Number(addr.latitude).toFixed(5)}, {Number(addr.longitude).toFixed(5)}
                  </Typography>
                )}
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
      {pageData.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageData.totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}
      {addresses.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No saved addresses yet. Add one above or at checkout.
        </Typography>
      )}
    </PageContainer>
  );
}

function normalizeAddressPayload(form) {
  return {
    ...form,
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
  };
}

function validateAddressForm(form) {
  const errors = {};
  if (!form.street.trim()) errors.street = 'Street address is required.';
  if (!form.city.trim()) errors.city = 'City is required.';
  const postalError = validatePostalCode(form.country, form.zipCode);
  if (postalError) errors.zipCode = postalError;
  return errors;
}
