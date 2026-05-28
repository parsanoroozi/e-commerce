import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { resolveImageUrl } from '../utils/imageUrl';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCart = () => {
    setLoading(true);
    cartApi
      .get()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      const updated = await cartApi.updateItem(productId, { productId, quantity });
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (productId) => {
    try {
      const updated = await cartApi.removeItem(productId);
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="page-center">Loading cart...</p>;

  return (
    <div className="container page">
      <h1>Your cart</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {!cart?.items?.length ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.productId} className="cart-item">
                <img src={resolveImageUrl(item.imageUrl)} alt="" />
                <div className="cart-item-info">
                  <h3>{item.productName}</h3>
                  <p>${Number(item.unitPrice).toFixed(2)} each</p>
                  <div className="quantity-row">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <p>${Number(item.lineTotal).toFixed(2)}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Summary</h2>
            <p>{cart.totalItems} items</p>
            <p className="product-price large">
              Total: ${Number(cart.totalAmount).toFixed(2)}
            </p>
            <Link to="/checkout" className="btn btn-primary full-width">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
