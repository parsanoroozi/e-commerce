import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          ShopVerse
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Shop
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/cart">Cart</NavLink>
              <NavLink to="/orders">Orders</NavLink>
            </>
          )}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Hi, {user.firstName}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
