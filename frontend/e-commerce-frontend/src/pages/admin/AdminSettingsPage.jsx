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
  stateTaxRates: '',
  countryTaxRates: '',
  standardShippingStateCosts: '',
  expressShippingStateCosts: '',
  standardShippingCountryCosts: '',
  expressShippingCountryCosts: '',
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.settings()
      .then((data) => setForm({
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
        stateTaxRates: formatRateMap(data.stateTaxRates),
        countryTaxRates: formatRateMap(data.countryTaxRates),
        standardShippingStateCosts: formatRateMap(data.standardShippingStateCosts),
        expressShippingStateCosts: formatRateMap(data.expressShippingStateCosts),
        standardShippingCountryCosts: formatRateMap(data.standardShippingCountryCosts),
        expressShippingCountryCosts: formatRateMap(data.expressShippingCountryCosts),
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
        taxRate: Number(form.taxRate || 0),
        standardShippingCost: Number(form.standardShippingCost || 0),
        expressShippingCost: Number(form.expressShippingCost || 0),
        stateTaxRates: parseRateMap(form.stateTaxRates),
        countryTaxRates: parseRateMap(form.countryTaxRates),
        standardShippingStateCosts: parseRateMap(form.standardShippingStateCosts),
        expressShippingStateCosts: parseRateMap(form.expressShippingStateCosts),
        standardShippingCountryCosts: parseRateMap(form.standardShippingCountryCosts),
        expressShippingCountryCosts: parseRateMap(form.expressShippingCountryCosts),
      };
      const updated = await adminApi.updateSettings(payload);
      setForm((current) => ({
        ...current,
        taxRate: String(updated.taxRate),
        standardShippingCost: String(updated.standardShippingCost),
        expressShippingCost: String(updated.expressShippingCost),
        stateTaxRates: formatRateMap(updated.stateTaxRates),
        countryTaxRates: formatRateMap(updated.countryTaxRates),
        standardShippingStateCosts: formatRateMap(updated.standardShippingStateCosts),
        expressShippingStateCosts: formatRateMap(updated.expressShippingStateCosts),
        standardShippingCountryCosts: formatRateMap(updated.standardShippingCountryCosts),
        expressShippingCountryCosts: formatRateMap(updated.expressShippingCountryCosts),
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
              <Typography variant="h6" gutterBottom>Tax and shipping</Typography>
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="State tax rates" helperText="One per line, example: CA=0.0925" fullWidth multiline rows={4} value={form.stateTaxRates} onChange={(e) => setForm({ ...form, stateTaxRates: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Country tax rates" helperText="One per line, example: US=0.08" fullWidth multiline rows={4} value={form.countryTaxRates} onChange={(e) => setForm({ ...form, countryTaxRates: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Standard shipping by state" helperText="One per line, example: CA=7.99" fullWidth multiline rows={4} value={form.standardShippingStateCosts} onChange={(e) => setForm({ ...form, standardShippingStateCosts: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Express shipping by state" helperText="One per line, example: CA=17.99" fullWidth multiline rows={4} value={form.expressShippingStateCosts} onChange={(e) => setForm({ ...form, expressShippingStateCosts: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Standard shipping by country" helperText="One per line, example: CA=11.99" fullWidth multiline rows={4} value={form.standardShippingCountryCosts} onChange={(e) => setForm({ ...form, standardShippingCountryCosts: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Express shipping by country" helperText="One per line, example: CA=24.99" fullWidth multiline rows={4} value={form.expressShippingCountryCosts} onChange={(e) => setForm({ ...form, expressShippingCountryCosts: e.target.value })} />
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

function formatRateMap(value = {}) {
  return Object.entries(value || {})
    .map(([key, amount]) => `${key}=${amount}`)
    .join('\n');
}

function parseRateMap(text = '') {
  return text.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    const [key, rawValue] = trimmed.split('=');
    if (key?.trim() && rawValue?.trim()) {
      acc[key.trim()] = Number(rawValue.trim());
    }
    return acc;
  }, {});
}
