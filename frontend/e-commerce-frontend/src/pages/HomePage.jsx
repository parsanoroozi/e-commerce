import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { showError } from '../utils/toast';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name,asc');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    setLoading(true);
    const [sortField, sortDir] = sort.split(',');
    productsApi
      .list({
        categoryId: categoryId || undefined,
        search: debouncedSearch || undefined,
        page,
        size: 12,
        sort: `${sortField},${sortDir}`,
      })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, debouncedSearch, page, sort]);

  useEffect(() => {
    setPage(0);
  }, [categoryId, debouncedSearch, sort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="container page">
      <section className="hero-banner">
        <div>
          <p className="hero-eyebrow">New season collection</p>
          <h1>Discover products you&apos;ll love</h1>
          <p className="hero-sub">Curated quality with fast checkout and secure payments.</p>
        </div>
      </section>

      <div className="filters-bar card-panel">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name,asc">Name A–Z</option>
          <option value="price,asc">Price: Low to high</option>
          <option value="price,desc">Price: High to low</option>
          <option value="createdAt,desc">Newest</option>
        </select>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>No products found</h2>
          <p className="muted">Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page + 1} of {totalPages}</span>
              <button type="button" className="btn btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
