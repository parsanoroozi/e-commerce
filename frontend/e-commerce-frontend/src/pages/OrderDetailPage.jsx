import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import OrderTimeline from '../components/OrderTimeline';
import PricingSummary from '../components/PricingSummary';
import { showError, showSuccess } from '../utils/toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = () =>
    ordersApi
      .get(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [id]);

  const canCancel = order && (order.status === 'CONFIRMED' || order.status === 'PENDING');

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const updated = await ordersApi.cancel(id);
      setOrder(updated);
      showSuccess('Order cancelled');
    } catch (err) {
      showError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <p className="page-center">Loading...</p>;
  if (error) return <p className="alert alert-error container">{error}</p>;
  if (!order) return null;

  return (
    <div className="container page">
      <Link to="/orders" className="back-link">
        ← Back to orders
      </Link>
      <div className="order-detail-header">
        <h1>Order #{order.id}</h1>
        <span className={`status-badge status-${order.status?.toLowerCase()}`}>{order.status}</span>
      </div>
      {location.state?.paymentSuccess && (
        <p className="alert alert-success">
          Payment successful! A confirmation email has been sent to your inbox.
        </p>
      )}
      <OrderTimeline status={order.status} />
      <p className="muted">Placed: {new Date(order.createdAt).toLocaleString()}</p>

      {canCancel && (
        <button type="button" className="btn btn-ghost" disabled={cancelling} onClick={handleCancel}>
          {cancelling ? 'Cancelling...' : 'Cancel order'}
        </button>
      )}

      <div className="order-detail-grid">
        <div className="card-panel">
          <h2>Shipping</h2>
          <p>
            {order.shippingStreet}, {order.shippingCity}, {order.shippingZipCode}, {order.shippingCountry}
          </p>
          {order.shippingMethod && <p className="muted">Method: {order.shippingMethod}</p>}
          <h2>Items</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>${Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="cart-summary">
          <h2>Payment summary</h2>
          <PricingSummary
            subtotal={order.subtotalAmount}
            discount={order.discountAmount}
            shipping={order.shippingCost}
            tax={order.taxAmount}
            total={order.totalAmount}
            couponCode={order.couponCode}
            shippingMethod={order.shippingMethod}
          />
        </aside>
      </div>
    </div>
  );
}
