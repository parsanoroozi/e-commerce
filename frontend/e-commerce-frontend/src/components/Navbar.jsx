import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { notificationsApi } from '../api/notifications';
import { wishlistApi } from '../api/wishlist';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const refreshCounts = () => {
    if (!isAuthenticated) return;
    cartApi.summary().then((d) => setCartCount(d.itemCount)).catch(() => {});
    wishlistApi.count().then((d) => setWishCount(d.count)).catch(() => {});
    notificationsApi.unreadCount().then((d) => setUnread(d.count)).catch(() => {});
  };

  useEffect(() => {
    refreshCounts();
  }, [isAuthenticated, location.pathname]);

  const toggleNotifications = async () => {
    if (!notifOpen) {
      const list = await notificationsApi.list();
      setNotifications(list);
    }
    setNotifOpen(!notifOpen);
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnread(0);
    const list = await notificationsApi.list();
    setNotifications(list);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">S</span>
          <span className="brand-text">ShopVerse</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Shop</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/wishlist" onClick={() => setMenuOpen(false)}>
                Wishlist
                {wishCount > 0 && <span className="badge">{wishCount}</span>}
              </NavLink>
              <NavLink to="/cart" onClick={() => setMenuOpen(false)}>
                Cart
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </NavLink>
              <NavLink to="/orders" onClick={() => setMenuOpen(false)}>Orders</NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin</NavLink>
          )}
        </nav>
        <div className="nav-auth">
          {isAuthenticated && (
            <div className="notif-wrap">
              <button type="button" className="btn btn-ghost notif-btn" onClick={toggleNotifications}>
                🔔
                {unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown card-panel">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    {unread > 0 && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="muted">No notifications</p>
                  ) : (
                    <ul>
                      {notifications.map((n) => (
                        <li key={n.id} className={n.read ? '' : 'unread'}>
                          <strong>{n.title}</strong>
                          <p className="muted">{n.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="user-greeting">Hi, {user.firstName}</Link>
              <button type="button" className="btn btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
