const TAX_RATE = 0.08;

export const SHIPPING_OPTIONS = {
  STANDARD: { price: 5.99, label: 'Standard (5-7 days)' },
  EXPRESS: { price: 14.99, label: 'Express (1-2 days)' },
};

export function estimateCheckout(subtotal, discount = 0, shippingMethod = 'STANDARD', freeShipping = false, settings = {}, destination = {}) {
  const shippingPrices = {
    STANDARD: destinationRate(
      settings.standardShippingStateCosts,
      settings.standardShippingCountryCosts,
      destination,
      Number(settings.standardShippingCost ?? SHIPPING_OPTIONS.STANDARD.price),
    ),
    EXPRESS: destinationRate(
      settings.expressShippingStateCosts,
      settings.expressShippingCountryCosts,
      destination,
      Number(settings.expressShippingCost ?? SHIPPING_OPTIONS.EXPRESS.price),
    ),
  };
  const shipping = freeShipping
    ? 0
    : shippingPrices[shippingMethod] ?? shippingPrices.STANDARD;
  const afterDiscount = Math.max(0, Number(subtotal) - Number(discount));
  const taxRate = destinationRate(settings.stateTaxRates, settings.countryTaxRates, destination, Number(settings.taxRate ?? TAX_RATE));
  const tax = (afterDiscount + shipping) * taxRate;
  const total = afterDiscount + tax + shipping;
  return {
    subtotal: Number(subtotal),
    discount: Number(discount),
    shipping,
    tax,
    total,
  };
}

function destinationRate(stateRates = {}, countryRates = {}, destination = {}, fallback) {
  const state = normalize(destination.state);
  const country = normalize(destination.country);
  if (state && stateRates?.[state] != null) return Number(stateRates[state]);
  if (country && countryRates?.[country] != null) return Number(countryRates[country]);
  return fallback;
}

function normalize(value) {
  return value ? String(value).trim().toUpperCase() : '';
}
