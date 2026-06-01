import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Grid, Pagination, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { shippingAddressesApi } from '../api/shippingAddresses';
import LocationPicker from '../components/LocationPicker';
import PasswordField from '../components/PasswordField';
import { useConfirm } from '../context/ConfirmDialogContext';
import { showError, showSuccess } from '../utils/toast';

const emptyAddress = {
  label: '',
  street: '',
  city: '',
  zipCode: '',
  country: '',
  latitude: '',
  longitude: '',
  isDefault: false,
};

export default function ProfilePage() {
  const { user, updateProfile, updateTwoFactor: saveTwoFactor, logout } = useAuth();
  const confirm = useConfirm();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    mobileNumber: user?.mobileNumber || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressPage, setAddressPage] = useState(0);
  const [addressPageData, setAddressPageData] = useState({ page: 0, totalPages: 0 });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [sessions, setSessions] = useState([]);
  const isStaff = user?.role && user.role !== 'CUSTOMER';

  useEffect(() => {
    setProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      mobileNumber: user?.mobileNumber || '',
    });
  }, [user]);

  const loadAddresses = useCallback(() =>
    shippingAddressesApi.list(addressPage).then((data) => {
      setAddresses(data.content);
      setAddressPageData(data);
    }).catch((err) => setAddressError(err.message)), [addressPage]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const loadSessions = useCallback(() =>
    authApi.sessions().then(setSessions).catch(() => {}), []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profile);
      showSuccess('Profile updated');
    } catch (err) {
      showError(err.message);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddressError('');
    const payload = normalizeAddressPayload(addressForm);
    try {
      if (editingAddressId) {
        await shippingAddressesApi.update(editingAddressId, payload);
        showSuccess('Address updated');
      } else {
        await shippingAddressesApi.create(payload);
        showSuccess('Address saved');
      }
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      await loadAddresses();
    } catch (err) {
      setAddressError(err.message);
    }
  };

  const editAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || '',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode,
      country: addr.country,
      latitude: addr.latitude ?? '',
      longitude: addr.longitude ?? '',
      isDefault: addr.isDefault,
    });
  };

  const deleteAddress = async (id) => {
    if (!(await confirm({
      title: 'Delete address?',
      description: 'This address will be removed from your saved addresses.',
      confirmText: 'Delete',
    }))) return;
    try {
      await shippingAddressesApi.remove(id);
      showSuccess('Address deleted');
      await loadAddresses();
    } catch (err) {
      setAddressError(err.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(passwords);
      showSuccess('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showError(err.message);
    }
  };

  const updateTwoFactor = async (enabled) => {
    try {
      await saveTwoFactor(enabled);
      showSuccess(enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
    } catch (err) {
      showError(err.message);
    }
  };

  const revokeSession = async (session) => {
    try {
      await authApi.revokeSession(session.id);
      showSuccess('Session revoked');
      if (session.current) {
        await logout();
      } else {
        await loadSessions();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>My profile</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{user?.email}</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card component="form" onSubmit={saveProfile}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Personal info</Typography>
              <Stack spacing={2}>
                <TextField label="First name" fullWidth value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                <TextField label="Last name" fullWidth value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                <TextField label="Mobile number" fullWidth value={profile.mobileNumber} onChange={(e) => setProfile({ ...profile, mobileNumber: e.target.value })} />
                <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>Save</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card component="form" onSubmit={changePassword}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Change password</Typography>
              <Stack spacing={2}>
                <PasswordField label="Current password" fullWidth value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                <PasswordField label="New password" fullWidth inputProps={{ minLength: 8 }} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                <Button type="submit" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Update password</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Security</Typography>
              {isStaff && (
                <FormControlLabel
                  control={<Checkbox checked={Boolean(user?.twoFactorEnabled)} onChange={(e) => updateTwoFactor(e.target.checked)} />}
                  label="Require email two-factor code for admin sign-in"
                />
              )}
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>Active sessions</Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {sessions.map((session) => (
                  <Card key={session.id} variant="outlined">
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                      <Box>
                        <Typography fontWeight={700}>{session.current ? 'Current session' : 'Session'} {session.revoked ? '(revoked)' : ''}</Typography>
                        <Typography variant="body2" color="text.secondary">{session.userAgent || 'Unknown device'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.ipAddress || 'Unknown IP'} | Last seen {new Date(session.lastSeenAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {!session.revoked && <Button color="error" onClick={() => revokeSession(session)}>Revoke</Button>}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Addresses</Typography>
              {addressError && <Alert severity="error" sx={{ mb: 2 }}>{addressError}</Alert>}
              <Box component="form" onSubmit={saveAddress} sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField label="Label" fullWidth value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField label="Street" required fullWidth value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField label="City" required fullWidth value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField label="Postal code" required fullWidth value={addressForm.zipCode} onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField label="Country" required fullWidth value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <LocationPicker
                      value={{ latitude: addressForm.latitude, longitude: addressForm.longitude }}
                      onChange={(location) => setAddressForm((current) => ({
                        ...current,
                        street: location.street ?? current.street,
                        city: location.city ?? current.city,
                        zipCode: location.zipCode ?? current.zipCode,
                        country: location.country ?? current.country,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControlLabel
                      control={<Checkbox checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />}
                      label="Default"
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained">{editingAddressId ? 'Update address' : 'Add address'}</Button>
                  {editingAddressId && (
                    <Button type="button" variant="outlined" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Box>
              <Stack spacing={1.5}>
                {addresses.map((addr) => (
                  <Card key={addr.id} variant="outlined">
                    <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography fontWeight={600}>
                          {addr.label || 'Address'}
                          {addr.isDefault && <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addr.street}, {addr.city}, {addr.zipCode}, {addr.country}
                        </Typography>
                        {addr.latitude != null && addr.longitude != null && (
                          <Typography variant="body2" color="text.secondary">
                            Map: {Number(addr.latitude).toFixed(5)}, {Number(addr.longitude).toFixed(5)}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => editAddress(addr)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => deleteAddress(addr.id)}>Delete</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
              {addresses.length === 0 && (
                <Typography color="text.secondary">No saved addresses yet.</Typography>
              )}
              {addressPageData.totalPages > 1 && (
                <Stack alignItems="center" sx={{ mt: 3 }}>
                  <Pagination
                    count={addressPageData.totalPages}
                    page={addressPage + 1}
                    onChange={(_, value) => setAddressPage(value - 1)}
                    color="primary"
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
