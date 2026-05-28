export default function PricingSummary({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  couponCode,
  shippingMethod,
}) {
  return (
    <dl className="pricing-summary">
      <div>
        <dt>Subtotal</dt>
        <dd>${Number(subtotal).toFixed(2)}</dd>
      </div>
      {discount > 0 && (
        <div className="discount-row">
          <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
          <dd>−${Number(discount).toFixed(2)}</dd>
        </div>
      )}
      <div>
        <dt>Shipping{shippingMethod ? ` (${shippingMethod})` : ''}</dt>
        <dd>${Number(shipping).toFixed(2)}</dd>
      </div>
      <div>
        <dt>Tax</dt>
        <dd>${Number(tax).toFixed(2)}</dd>
      </div>
      <div className="pricing-total">
        <dt>Total</dt>
        <dd>${Number(total).toFixed(2)}</dd>
      </div>
    </dl>
  );
}
