import { Box, Button, Link, Stack } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import AuthShell from '../components/common/AuthShell';
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
    <AuthShell title="Set new password" subtitle="Secure reset">
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <PasswordField label="New password" required fullWidth inputProps={{ minLength: 8 }} value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="contained" fullWidth>Reset password</Button>
                <Link component={RouterLink} to="/login">Login</Link>
              </Stack>
            </Box>
    </AuthShell>
  );
}
