export default function StarRating({ value = 0, count }) {
  const rounded = Math.round((value || 0) * 10) / 10;
  return (
    <span className="star-rating" title={count != null ? `${rounded} (${count} reviews)` : undefined}>
      {'★'.repeat(Math.round(value || 0))}
      {'☆'.repeat(5 - Math.round(value || 0))}
      {count != null && <span className="review-count">({count})</span>}
    </span>
  );
}
