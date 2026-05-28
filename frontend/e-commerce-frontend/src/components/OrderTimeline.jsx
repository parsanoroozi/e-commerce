const STEPS = ['AWAITING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const LABELS = {
  AWAITING_PAYMENT: 'Payment',
  PENDING: 'Processing',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return <p className="status-pill cancelled">{LABELS[status]}</p>;
  }
  const idx = STEPS.indexOf(status === 'PENDING' ? 'CONFIRMED' : status);
  return (
    <ol className="order-timeline">
      {STEPS.map((step, i) => (
        <li key={step} className={i <= idx ? 'done' : ''}>
          <span className="dot" />
          {LABELS[step]}
        </li>
      ))}
    </ol>
  );
}
