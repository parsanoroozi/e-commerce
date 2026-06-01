const TAX_RATE = 0.08;

export const SHIPPING_OPTIONS = {
  STANDARD: { price: 5.99, label: 'Standard (5-7 days)' },
  EXPRESS: { price: 14.99, label: 'Express (1-2 days)' },
};

export function estimateCheckout(subtotal, discount = 0, shippingMethod = 'STANDARD', freeShipping = false, settings = {}) {
  const shippingPrices = {
    STANDARD: Number(settings.standardShippingCost ?? SHIPPING_OPTIONS.STANDARD.price),
    EXPRESS: Number(settings.expressShippingCost ?? SHIPPING_OPTIONS.EXPRESS.price),
  };
  const shipping = freeShipping
    ? 0
    : shippingPrices[shippingMethod] ?? shippingPrices.STANDARD;
  const afterDiscount = Math.max(0, Number(subtotal) - Number(discount));
  const tax = afterDiscount * Number(settings.taxRate ?? TAX_RATE);
  const total = afterDiscount + tax + shipping;
  return {
    subtotal: Number(subtotal),
    discount: Number(discount),
    shipping,
    tax,
    total,
  };
}
