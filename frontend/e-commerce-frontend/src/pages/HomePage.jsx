import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    productsApi
      .list({
        categoryId: categoryId || undefined,
        search: search || undefined,
        page,
      })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, search, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="container page">
      <section className="hero">
        <h1>Discover quality products</h1>
        <p>Browse our catalog, add to cart, and checkout in minutes.</p>
      </section>

      <form className="filters" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="page-center">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="page-center">No products found.</p>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
