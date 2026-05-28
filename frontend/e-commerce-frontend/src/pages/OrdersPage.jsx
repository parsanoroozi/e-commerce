import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';

const STATUS_COLORS = {
  AWAITING_PAYMENT: 'status-pending',
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  SHIPPED: 'status-shipped',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi
      .myOrders()
      .then((data) => setOrders(data.content))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-center">Loading orders...</p>;

  return (
    <div className="container page">
      <h1>My orders</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {orders.length === 0 ? (
        <p className="empty-state">You have no orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="order-card">
              <div>
                <strong>Order #{order.id}</strong>
                <p className="muted">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`status-badge ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
              <p className="product-price">${Number(order.totalAmount).toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
