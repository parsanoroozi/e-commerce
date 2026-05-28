import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ordersApi } from '../api/orders';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi
      .get(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page-center">Loading...</p>;
  if (error) return <p className="alert alert-error container">{error}</p>;
  if (!order) return null;

  return (
    <div className="container page">
      <Link to="/orders" className="back-link">
        &larr; Back to orders
      </Link>
      <h1>Order #{order.id}</h1>
      {location.state?.paymentSuccess && (
        <p className="alert alert-success">
          Payment successful! A confirmation email has been sent to your inbox.
        </p>
      )}
      <p>
        Status: <strong>{order.status}</strong>
      </p>
      <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
      <h2>Shipping</h2>
      <p>
        {order.shippingStreet}, {order.shippingCity}, {order.shippingZipCode},{' '}
        {order.shippingCountry}
      </p>
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
      <p className="product-price large">
        Total: ${Number(order.totalAmount).toFixed(2)}
      </p>
    </div>
  );
}
