import { describe, expect, it } from 'vitest';
import { estimateCheckout, SHIPPING_OPTIONS } from './checkoutPricing';

describe('estimateCheckout', () => {
  it('calculates discount, tax, shipping, and total', () => {
    const estimate = estimateCheckout(100, 10, 'EXPRESS');

    expect(estimate).toEqual({
      subtotal: 100,
      discount: 10,
      shipping: SHIPPING_OPTIONS.EXPRESS.price,
      tax: 7.2,
      total: 112.19,
    });
  });

  it('does not allow discounts below zero subtotal', () => {
    const estimate = estimateCheckout(20, 50, 'UNKNOWN');

    expect(estimate.tax).toBe(0);
    expect(estimate.total).toBe(SHIPPING_OPTIONS.STANDARD.price);
  });

  it('sets shipping to zero for free shipping coupons', () => {
    const estimate = estimateCheckout(100, 0, 'EXPRESS', true);

    expect(estimate.shipping).toBe(0);
    expect(estimate.total).toBe(108);
  });
});
