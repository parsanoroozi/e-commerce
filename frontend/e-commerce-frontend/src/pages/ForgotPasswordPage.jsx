import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { authApi } from '../api/auth';
import PageContainer from '../components/layout/PageContainer';
import { showError, showSuccess } from '../utils/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      showSuccess('If the email exists, a reset link was sent (check backend logs in dev).');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>Forgot password</Typography>
            {sent ? (
              <Alert severity="info">Check your email or backend console for the reset link.</Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField label="Email" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Button type="submit" variant="contained" fullWidth>Send reset link</Button>
                </Stack>
              </Box>
            )}
            <Button component={RouterLink} to="/login" sx={{ mt: 2 }}>Back to login</Button>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
