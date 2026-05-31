import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { clearApiCache, emitApiChange } from '../api/client';

const AuthContext = createContext(null);
const LAST_LOGGED_OUT_USER_KEY = 'shopverse:last-logged-out-user-id';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    const { token, user: loggedIn } = await authApi.login(credentials);
    localStorage.setItem('token', token);
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/login', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(loggedIn);
    return loggedIn;
  };

  const register = async (data) => {
    const { token, user: registered } = await authApi.register(data);
    localStorage.setItem('token', token);
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/register', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(registered);
    return registered;
  };

  const updateProfile = async (data) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const logout = () => {
    if (user?.id != null) {
      localStorage.setItem(LAST_LOGGED_OUT_USER_KEY, String(user.id));
    }
    localStorage.removeItem('token');
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/logout', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      updateProfile,
      logout,
      lastLoggedOutUserKey: LAST_LOGGED_OUT_USER_KEY,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
