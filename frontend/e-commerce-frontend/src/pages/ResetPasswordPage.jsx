import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
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
    <div className="container page auth-page">
      <form className="auth-card card-panel" onSubmit={handleSubmit}>
        <h1>Set new password</h1>
        <label>
          New password
          <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary full-width">Reset password</button>
        <Link to="/login">Login</Link>
      </form>
    </div>
  );
}
