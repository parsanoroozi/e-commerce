import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../api/wishlist';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError, showSuccess } from '../utils/toast';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    wishlistApi
      .list()
      .then(setItems)
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await wishlistApi.remove(id);
    showSuccess('Removed from wishlist');
    load();
  };

  return (
    <div className="container page">
      <h1>Wishlist</h1>
      {loading ? (
        <ProductGridSkeleton />
      ) : items.length === 0 ? (
        <div className="empty-state card-panel">
          <p>Your wishlist is empty.</p>
          <Link to="/" className="btn btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((p) => (
            <div key={p.id} className="wishlist-item-wrap">
              <ProductCard product={p} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(p.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
