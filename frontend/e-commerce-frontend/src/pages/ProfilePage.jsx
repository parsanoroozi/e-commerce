import { Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { authApi } from '../api/auth';
import PageContainer from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await authApi.updateProfile(profile);
      showSuccess('Profile updated');
    } catch (err) {
      showError(err.message);
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
                <TextField label="Current password" type="password" fullWidth value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                <TextField label="New password" type="password" fullWidth inputProps={{ minLength: 8 }} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                <Button type="submit" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Update password</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
