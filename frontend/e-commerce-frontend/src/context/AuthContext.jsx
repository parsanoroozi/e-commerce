import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { clearApiCache, emitApiChange } from '../api/client';

const AuthContext = createContext(null);
const LAST_LOGGED_OUT_USER_KEY = 'shopverse:last-logged-out-user-id';
const ADMIN_ROLES = ['ADMIN', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'FULFILLMENT_STAFF', 'SUPPORT_STAFF'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials, twoFactor = false) => {
    const response = twoFactor ? await authApi.verifyTwoFactor(credentials) : await authApi.login(credentials);
    if (response.requiresTwoFactor) {
      return response;
    }
    const { user: loggedIn } = response;
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/login', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (data) => {
    const { user: registered } = await authApi.register(data);
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/register', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(registered);
    return registered;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const updateTwoFactor = useCallback(async (enabled) => {
    const updated = await authApi.updateTwoFactor(enabled);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(async () => {
    if (user?.id != null) {
      localStorage.setItem(LAST_LOGGED_OUT_USER_KEY, String(user.id));
    }
    try {
      await authApi.logout();
    } catch {
      // Local logout should still clear UI state if the network is unavailable.
    }
    clearApiCache();
    emitApiChange({ method: 'POST', path: '/api/auth/logout', resources: ['auth', 'cart', 'wishlist', 'notifications', 'orders'] });
    setUser(null);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: ADMIN_ROLES.includes(user?.role),
      login,
      register,
      updateProfile,
      updateTwoFactor,
      logout,
      lastLoggedOutUserKey: LAST_LOGGED_OUT_USER_KEY,
    }),
    [user, loading, login, register, updateProfile, updateTwoFactor, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
