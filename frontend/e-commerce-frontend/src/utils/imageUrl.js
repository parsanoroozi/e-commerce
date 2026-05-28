export function resolveImageUrl(url) {
  if (!url) return 'https://placehold.co/400x300?text=No+Image';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}
