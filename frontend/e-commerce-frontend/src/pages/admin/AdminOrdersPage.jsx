import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders';

const STATUSES = ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    ordersApi.adminAll().then((data) => setOrders(data.content)).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>All orders</h2>
      {error && <p className="alert alert-error">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link to={`/orders/${order.id}`}>#{order.id}</Link>
              </td>
              <td>
                {order.customer
                  ? `${order.customer.firstName} ${order.customer.lastName}`
                  : '-'}
              </td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>${Number(order.totalAmount).toFixed(2)}</td>
              <td>{order.status}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
