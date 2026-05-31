import { Box, Button, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import PageContainer from '../components/layout/PageContainer';
import PasswordField from '../components/PasswordField';
import { showError, showSuccess } from '../utils/toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = params.get('token');
    if (!token) {
      showError('Missing reset token');
      return;
    }
    try {
      await authApi.resetPassword({ token, newPassword: password });
      showSuccess('Password reset — you can log in now');
      navigate('/login');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>Set new password</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <PasswordField label="New password" required fullWidth inputProps={{ minLength: 8 }} value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="contained" fullWidth>Reset password</Button>
                <Link component={RouterLink} to="/login">Login</Link>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
