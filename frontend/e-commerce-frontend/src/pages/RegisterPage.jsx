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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
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
              Create account
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField label="First name" required fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <TextField label="Last name" required fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                <TextField label="Email" type="email" required fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <TextField label="Password (min 8 characters)" type="password" required fullWidth inputProps={{ minLength: 8 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                  {loading ? 'Creating...' : 'Register'}
                </Button>
                <Typography variant="body2" textAlign="center">
                  Already have an account? <Link component={RouterLink} to="/login">Login</Link>
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
