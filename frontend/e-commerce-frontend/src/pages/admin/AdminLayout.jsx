import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container page admin-layout">
      <h1>Admin panel</h1>
      <nav className="admin-nav">
        <NavLink to="/admin/products" end>
          Products
        </NavLink>
        <NavLink to="/admin/categories">Categories</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
