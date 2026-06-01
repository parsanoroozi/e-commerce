import {
  Alert,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LocationPicker from './LocationPicker';
import { COUNTRIES, countryByName, validatePostalCode } from '../utils/address';

export default function AddressFormFields({ form, setForm, fieldPrefix = '', errors = {}, showLabel = true }) {
  const country = countryByName(form.country || form.shippingCountry);
  const postalValue = form.zipCode ?? form.shippingZipCode ?? '';
  const postalError = errors.zipCode || errors.shippingZipCode || validatePostalCode(country.name, postalValue);
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const key = (base) => (fieldPrefix && base !== 'label' ? `${fieldPrefix}${base[0].toUpperCase()}${base.slice(1)}` : base);

  return (
    <Stack spacing={2}>
      {showLabel && (
        <TextField
          label="Label"
          placeholder="Home, Work..."
          value={form[key('label')] || ''}
          onChange={(e) => setValue(key('label'), e.target.value)}
        />
      )}
      <TextField
        label="Street address"
        required
        value={form[key('street')] || ''}
        error={Boolean(errors[key('street')])}
        helperText={errors[key('street')]}
        onChange={(e) => setValue(key('street'), e.target.value)}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="City"
            required
            fullWidth
            value={form[key('city')] || ''}
            error={Boolean(errors[key('city')])}
            helperText={errors[key('city')]}
            onChange={(e) => setValue(key('city'), e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={form[key('country')] || country.name}
              onChange={(e) => {
                setValue(key('country'), e.target.value);
                setValue(key('state'), '');
              }}
            >
              {COUNTRIES.map((entry) => (
                <MenuItem key={entry.code} value={entry.name}>{entry.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>State / region</InputLabel>
            <Select
              label="State / region"
              value={form[key('state')] || ''}
              onChange={(e) => setValue(key('state'), e.target.value)}
            >
              {country.states.map((state) => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Postal code"
            required
            fullWidth
            value={postalValue}
            error={Boolean(postalError)}
            helperText={postalError || country.postalHint}
            onChange={(e) => setValue(key('zipCode'), e.target.value)}
          />
        </Grid>
      </Grid>
      <Alert severity={form[key('latitude')] && form[key('longitude')] ? 'success' : 'info'} variant="outlined">
        <Typography variant="body2">
          {form[key('latitude')] && form[key('longitude')]
            ? `Map pin selected at ${Number(form[key('latitude')]).toFixed(5)}, ${Number(form[key('longitude')]).toFixed(5)}.`
            : 'Add a map pin to help delivery teams locate the address faster.'}
        </Typography>
      </Alert>
      <LocationPicker
        value={{ latitude: form[key('latitude')], longitude: form[key('longitude')] }}
        onChange={(location) => setForm((current) => ({
          ...current,
          [key('street')]: location.street ?? current[key('street')],
          [key('city')]: location.city ?? current[key('city')],
          [key('zipCode')]: location.zipCode ?? current[key('zipCode')],
          [key('country')]: location.country ?? current[key('country')],
          [key('latitude')]: location.latitude,
          [key('longitude')]: location.longitude,
        }))}
      />
    </Stack>
  );
}
