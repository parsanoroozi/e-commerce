import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then(setData);
  }, []);

  if (!data) return <p className="page-center">Loading dashboard...</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total orders</span>
          <strong>{data.totalOrders}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <strong>{data.pendingOrders}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low stock</span>
          <strong>{data.lowStockProducts}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Revenue today</span>
          <strong>${Number(data.revenueToday).toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total revenue</span>
          <strong>${Number(data.revenueTotal).toFixed(2)}</strong>
        </div>
      </div>
      <h3>Low stock</h3>
      <ul className="simple-list">
        {data.lowStockItems.map((p) => (
          <li key={p.id}>
            {p.name} — <strong>{p.stockQuantity}</strong> left
          </li>
        ))}
      </ul>
      <h3>Recent orders</h3>
      <ul className="simple-list">
        {data.recentOrders.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`}>#{o.id}</Link> — {o.status} — ${Number(o.totalAmount).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
