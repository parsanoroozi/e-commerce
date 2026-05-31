const TAX_RATE = 0.08;

export const SHIPPING_OPTIONS = {
  STANDARD: { price: 5.99, label: 'Standard (5-7 days)' },
  EXPRESS: { price: 14.99, label: 'Express (1-2 days)' },
};

export function estimateCheckout(subtotal, discount = 0, shippingMethod = 'STANDARD') {
  const shipping = SHIPPING_OPTIONS[shippingMethod]?.price ?? SHIPPING_OPTIONS.STANDARD.price;
  const afterDiscount = Math.max(0, Number(subtotal) - Number(discount));
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + tax + shipping;
  return {
    subtotal: Number(subtotal),
    discount: Number(discount),
    shipping,
    tax,
    total,
  };
}
