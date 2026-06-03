export function resolveImageUrl(url) {
  if (!url) return '/luxury-assets/products/wireless-headphones.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}
