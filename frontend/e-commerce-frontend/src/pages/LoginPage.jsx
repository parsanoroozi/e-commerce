import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/common/AuthShell';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, lastLoggedOutUserKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [challengeId, setChallengeId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form);
      if (result?.requiresTwoFactor) {
        setChallengeId(result.twoFactorChallengeId);
        setError('');
        return;
      }
      const user = result;
      const lastLoggedOutUserId = localStorage.getItem(lastLoggedOutUserKey);
      const sameAccount = !lastLoggedOutUserId || String(user.id) === lastLoggedOutUserId;
      const roleHome = user.role !== 'CUSTOMER' ? '/admin/dashboard' : '/';
      const previousPath = resolvePreviousPath(location.state?.from);
      navigate(sameAccount && previousPath ? previousPath : roleHome, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Member access">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Demo admin: admin@shop.com / admin1234567
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  disabled={Boolean(challengeId)}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <PasswordField
                  label="Password"
                  required
                  fullWidth
                  disabled={Boolean(challengeId)}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {challengeId && (
                  <TextField
                    label="Admin verification code"
                    required
                    fullWidth
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    helperText="Check the admin account email for the 6-digit code."
                  />
                )}
                <Typography variant="body2">
                  <Link component={RouterLink} to="/forgot-password">Forgot password?</Link>
                </Typography>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                  onClick={async (e) => {
                    if (!challengeId) return;
                    e.preventDefault();
                    setLoading(true);
                    setError('');
                    try {
                      const user = await login({ challengeId, code: twoFactorCode }, true);
                      navigate(user.role === 'CUSTOMER' ? '/' : '/admin/dashboard', { replace: true });
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'Signing in...' : challengeId ? 'Verify code' : 'Login'}
                </Button>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  No account? <Link component={RouterLink} to="/register">Register</Link>
                </Typography>
              </Stack>
            </Box>
    </AuthShell>
  );
}

function resolvePreviousPath(from) {
  if (!from) return null;
  if (typeof from === 'string') return from;
  if (typeof from.pathname === 'string') {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return null;
}
