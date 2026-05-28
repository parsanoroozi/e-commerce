import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong className="brand-footer">ShopVerse</strong>
          <p className="muted">Quality products, seamless checkout.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/">Catalog</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/orders">Orders</Link>
          <Link to="/addresses">Addresses</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>
      <p className="footer-copy muted">© {new Date().getFullYear()} ShopVerse</p>
    </footer>
  );
}
