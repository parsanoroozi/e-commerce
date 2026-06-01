import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { showError, showSuccess } from '../../utils/toast';

const empty = {
  lowStockThreshold: 10,
  brandName: '',
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  homepageBannerTitle: '',
  homepageBannerSubtitle: '',
  homepageBannerImageUrl: '',
  homepageBannerCtaText: '',
  homepageBannerCtaUrl: '',
  taxRate: '0.08',
  standardShippingCost: '5.99',
  expressShippingCost: '14.99',
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.settings()
      .then((data) => setForm({
        lowStockThreshold: data.lowStockThreshold ?? 10,
        brandName: data.brandName || '',
        logoUrl: data.logoUrl || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        contactAddress: data.contactAddress || '',
        homepageBannerTitle: data.homepageBannerTitle || '',
        homepageBannerSubtitle: data.homepageBannerSubtitle || '',
        homepageBannerImageUrl: data.homepageBannerImageUrl || '',
        homepageBannerCtaText: data.homepageBannerCtaText || '',
        homepageBannerCtaUrl: data.homepageBannerCtaUrl || '',
        taxRate: String(data.taxRate ?? '0.08'),
        standardShippingCost: String(data.standardShippingCost ?? '5.99'),
        expressShippingCost: String(data.expressShippingCost ?? '14.99'),
      }))
      .catch((err) => setError(err.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        lowStockThreshold: Number(form.lowStockThreshold),
        taxRate: Number(form.taxRate || 0),
        standardShippingCost: Number(form.standardShippingCost || 0),
        expressShippingCost: Number(form.expressShippingCost || 0),
      };
      const updated = await adminApi.updateSettings(payload);
      setForm((current) => ({
        ...current,
        lowStockThreshold: updated.lowStockThreshold,
        taxRate: String(updated.taxRate),
        standardShippingCost: String(updated.standardShippingCost),
        expressShippingCost: String(updated.expressShippingCost),
      }));
      showSuccess('Store settings saved');
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Store settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={save}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Brand and contact</Typography>
              <Stack spacing={2}>
                <TextField label="Brand name" required value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
                <TextField label="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
                <TextField label="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                <TextField label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
                <TextField label="Contact address" multiline rows={3} value={form.contactAddress} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Homepage banner</Typography>
              <Stack spacing={2}>
                <TextField label="Banner title" value={form.homepageBannerTitle} onChange={(e) => setForm({ ...form, homepageBannerTitle: e.target.value })} />
                <TextField label="Banner subtitle" multiline rows={2} value={form.homepageBannerSubtitle} onChange={(e) => setForm({ ...form, homepageBannerSubtitle: e.target.value })} />
                <TextField label="Banner image URL" value={form.homepageBannerImageUrl} onChange={(e) => setForm({ ...form, homepageBannerImageUrl: e.target.value })} />
                <TextField label="CTA text" value={form.homepageBannerCtaText} onChange={(e) => setForm({ ...form, homepageBannerCtaText: e.target.value })} />
                <TextField label="CTA URL" value={form.homepageBannerCtaUrl} onChange={(e) => setForm({ ...form, homepageBannerCtaUrl: e.target.value })} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>Tax, shipping, and inventory</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Tax rate" type="number" inputProps={{ step: 0.0001, min: 0 }} fullWidth value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Standard shipping" type="number" inputProps={{ step: 0.01, min: 0 }} fullWidth value={form.standardShippingCost} onChange={(e) => setForm({ ...form, standardShippingCost: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Express shipping" type="number" inputProps={{ step: 0.01, min: 0 }} fullWidth value={form.expressShippingCost} onChange={(e) => setForm({ ...form, expressShippingCost: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField label="Low stock threshold" type="number" inputProps={{ min: 1 }} fullWidth value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 3 }}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
