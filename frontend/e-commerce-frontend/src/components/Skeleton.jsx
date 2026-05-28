export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-line w-80" />
          <div className="skeleton skeleton-line w-40" />
        </div>
      ))}
    </div>
  );
}
