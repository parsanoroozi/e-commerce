import { describe, expect, it } from 'vitest';
import { estimateCheckout, SHIPPING_OPTIONS } from './checkoutPricing';

describe('estimateCheckout', () => {
  it('calculates discount, tax, shipping, and total', () => {
    const estimate = estimateCheckout(100, 10, 'EXPRESS');

    expect(estimate).toEqual({
      subtotal: 100,
      discount: 10,
      shipping: SHIPPING_OPTIONS.EXPRESS.price,
      tax: 8.3992,
      total: 113.3892,
    });
  });

  it('does not allow discounts below zero subtotal', () => {
    const estimate = estimateCheckout(20, 50, 'UNKNOWN');

    expect(estimate.tax).toBe(0.4792);
    expect(estimate.total).toBe(6.4692);
  });

  it('sets shipping to zero for free shipping coupons', () => {
    const estimate = estimateCheckout(100, 0, 'EXPRESS', true);

    expect(estimate.shipping).toBe(0);
    expect(estimate.total).toBe(108);
  });

  it('uses destination tax and shipping overrides', () => {
    const estimate = estimateCheckout(100, 0, 'STANDARD', false, {
      taxRate: 0.08,
      standardShippingCost: 5.99,
      stateTaxRates: { CA: 0.0925 },
      standardShippingStateCosts: { CA: 9.5 },
    }, { state: 'ca', country: 'US' });

    expect(estimate.shipping).toBe(9.5);
    expect(estimate.tax).toBe(10.12875);
    expect(estimate.total).toBe(119.62875);
  });
});
