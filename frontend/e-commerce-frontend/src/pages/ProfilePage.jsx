import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
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
    <div className="container page">
      <h1>My profile</h1>
      <p className="muted">{user?.email}</p>
      <div className="profile-grid">
        <form className="card-panel" onSubmit={saveProfile}>
          <h2>Personal info</h2>
          <label>
            First name
            <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
          </label>
          <label>
            Last name
            <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
        <form className="card-panel" onSubmit={changePassword}>
          <h2>Change password</h2>
          <label>
            Current password
            <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          </label>
          <label>
            New password
            <input type="password" minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-secondary">Update password</button>
        </form>
      </div>
    </div>
  );
}
