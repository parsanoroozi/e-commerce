import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    productsApi
      .get(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setError('');
    setMessage('');
    try {
      await cartApi.addItem({ productId: Number(id), quantity });
      setMessage('Added to cart!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="page-center">Loading...</p>;
  if (error && !product) return <p className="alert alert-error container">{error}</p>;
  if (!product) return null;

  return (
    <div className="container page product-detail">
      <Link to="/" className="back-link">
        &larr; Back to shop
      </Link>
      <div className="product-detail-grid">
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
        />
        <div>
          <span className="product-category">{product.categoryName}</span>
          <h1>{product.name}</h1>
          <p className="product-price large">${Number(product.price).toFixed(2)}</p>
          <p>{product.description}</p>
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
          {message && <p className="alert alert-success">{message}</p>}
          {error && <p className="alert alert-error">{error}</p>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={product.stockQuantity < 1}
            onClick={addToCart}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
