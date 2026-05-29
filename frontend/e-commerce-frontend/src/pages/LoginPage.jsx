import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      const redirect = location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/');
      navigate(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, md: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Demo admin: admin@shop.com / admin12345
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextField
                  label="Password"
                  type="password"
                  required
                  fullWidth
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Typography variant="body2">
                  <Link component={RouterLink} to="/forgot-password">Forgot password?</Link>
                </Typography>
                <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                  {loading ? 'Signing in...' : 'Login'}
                </Button>
                <Typography variant="body2" textAlign="center">
                  No account? <Link component={RouterLink} to="/register">Register</Link>
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
