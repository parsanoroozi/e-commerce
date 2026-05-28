import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
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
    <div className="container page auth-page">
      <form className="auth-card card-panel" onSubmit={handleSubmit}>
        <h1>Forgot password</h1>
        {sent ? (
          <p className="muted">Check your email or backend console for the reset link.</p>
        ) : (
          <>
            <label>
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary full-width">Send reset link</button>
          </>
        )}
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}
