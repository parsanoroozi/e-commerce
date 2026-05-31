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
import { authApi } from '../api/auth';
import PageContainer from '../components/layout/PageContainer';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  mobileNumber: '',
  emailVerificationCode: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState('details');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const sendVerificationCode = async () => {
    setError('');
    setMessage('');
    if (!emailValid) {
      setError('Enter a valid email address first.');
      return false;
    }
    setSendingCode(true);
    try {
      await authApi.sendEmailVerification(form.email.trim());
      setMessage('Verification code sent. Check your inbox.');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSendingCode(false);
    }
  };

  const continueToVerification = async (e) => {
    e.preventDefault();
    const sent = await sendVerificationCode();
    if (sent) setStep('verify');
  };

  const handleRegister = async (e) => {
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
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

            {step === 'details' ? (
              <Box component="form" onSubmit={continueToVerification}>
                <Stack spacing={2}>
                  <TextField label="First name" required fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  <TextField label="Last name" required fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  <TextField label="Mobile number" fullWidth value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
                  <TextField
                    label="Email"
                    type="email"
                    required
                    fullWidth
                    error={Boolean(form.email) && !emailValid}
                    helperText={Boolean(form.email) && !emailValid ? 'Enter a valid email address' : ''}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value, emailVerificationCode: '' })}
                  />
                  <PasswordField label="Password (min 8 characters)" required fullWidth inputProps={{ minLength: 8 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <Button type="submit" variant="contained" size="large" disabled={sendingCode || !emailValid} fullWidth>
                    {sendingCode ? 'Sending code...' : 'Continue'}
                  </Button>
                  <Typography variant="body2" textAlign="center">
                    Already have an account? <Link component={RouterLink} to="/login">Login</Link>
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleRegister}>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Enter the 6-digit code sent to {form.email}.
                  </Typography>
                  <TextField
                    label="Verification code"
                    required
                    fullWidth
                    autoFocus
                    inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    value={form.emailVerificationCode}
                    onChange={(e) => setForm({ ...form, emailVerificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  />
                  <Button type="submit" variant="contained" size="large" disabled={loading || form.emailVerificationCode.length !== 6} fullWidth>
                    {loading ? 'Creating...' : 'Create account'}
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button type="button" variant="outlined" fullWidth onClick={() => setStep('details')}>
                      Back
                    </Button>
                    <Button type="button" variant="outlined" fullWidth disabled={sendingCode} onClick={sendVerificationCode}>
                      {sendingCode ? 'Sending...' : 'Resend'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
