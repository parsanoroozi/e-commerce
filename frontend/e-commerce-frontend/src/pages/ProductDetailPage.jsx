import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { productsApi } from '../api/products';
import { reviewsApi } from '../api/reviews';
import { wishlistApi } from '../api/wishlist';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { ProductGridSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';
import { showError, showSuccess } from '../utils/toast';

const RECENT_KEY = 'shopverse_recent';

function trackRecent(id) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    const next = [Number(id), ...ids.filter((x) => x !== Number(id))].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsApi.get(id),
      productsApi.related(id),
      reviewsApi.list(id).then((p) => p.content ?? p),
    ])
      .then(([prod, rel, revs]) => {
        setProduct(prod);
        setRelated(rel);
        setReviews(revs);
        const imgs = prod.images?.length ? prod.images : prod.imageUrl ? [prod.imageUrl] : [];
        setActiveImage(imgs[0] || '');
        trackRecent(id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    wishlistApi
      .list()
      .then((items) => setInWishlist(items.some((p) => p.id === Number(id))))
      .catch(() => {});
  }, [id, isAuthenticated]);

  const gallery = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      await cartApi.addItem({ productId: Number(id), quantity });
      showSuccess('Added to cart');
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      if (inWishlist) {
        await wishlistApi.remove(id);
        setInWishlist(false);
        showSuccess('Removed from wishlist');
      } else {
        await wishlistApi.add(id);
        setInWishlist(true);
        showSuccess('Added to wishlist');
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      const created = await reviewsApi.create(id, reviewForm);
      setReviews((prev) => [created, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      showSuccess('Review submitted');
      const updated = await productsApi.get(id);
      setProduct(updated);
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) return <div className="container page"><ProductGridSkeleton count={1} /></div>;
  if (error && !product) return <p className="alert alert-error container">{error}</p>;
  if (!product) return null;

  return (
    <div className="container page product-detail">
      <Link to="/" className="back-link">
        ← Back to shop
      </Link>
      <div className="product-detail-grid">
        <div className="gallery">
          <img src={resolveImageUrl(activeImage || product.imageUrl)} alt={product.name} className="gallery-main" />
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  className={activeImage === url ? 'active' : ''}
                  onClick={() => setActiveImage(url)}
                >
                  <img src={resolveImageUrl(url)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <span className="product-category">{product.categoryName}</span>
          <h1>{product.name}</h1>
          {product.reviewCount > 0 && (
            <StarRating value={product.averageRating} count={product.reviewCount} />
          )}
          <p className="product-price large">${Number(product.price).toFixed(2)}</p>
          <p className="product-description">{product.description}</p>
          <p className="stock">In stock: {product.stockQuantity}</p>
          <div className="quantity-row">
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min="1"
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="product-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={product.stockQuantity < 1}
              onClick={addToCart}
            >
              Add to cart
            </button>
            <button type="button" className="btn btn-secondary" onClick={toggleWishlist}>
              {inWishlist ? '♥ In wishlist' : '♡ Add to wishlist'}
            </button>
          </div>
        </div>
      </div>

      <section className="reviews-section card-panel">
        <h2>Customer reviews</h2>
        {isAuthenticated && (
          <form className="review-form" onSubmit={submitReview}>
            <label>
              Rating
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} stars</option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Post review</button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="muted">No reviews yet. Be the first!</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <StarRating value={r.rating} />
                <strong>{r.userName}</strong>
                <span className="muted"> · {new Date(r.createdAt).toLocaleDateString()}</span>
                {r.comment && <p>{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section className="related-section">
          <h2>You may also like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
