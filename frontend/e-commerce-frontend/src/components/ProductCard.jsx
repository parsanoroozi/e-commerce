import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-image">
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="product-card-body">
        <span className="product-category">{product.categoryName}</span>
        <Link to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
        <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm">
          View details
        </Link>
      </div>
    </article>
  );
}
