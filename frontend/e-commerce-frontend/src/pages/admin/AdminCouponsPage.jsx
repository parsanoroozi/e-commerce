import { useEffect, useState } from 'react';
import { couponsApi } from '../../api/coupons';
import { showError, showSuccess } from '../../utils/toast';

const empty = {
  code: '',
  type: 'percent',
  value: '10',
  minOrderAmount: '50',
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);

  const load = () =>
    couponsApi
      .adminList()
      .then(setCoupons)
      .catch((err) => showError(err.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      minOrderAmount: Number(form.minOrderAmount),
      active: form.active,
      discountPercent: form.type === 'percent' ? Number(form.value) : null,
      discountAmount: form.type === 'fixed' ? Number(form.value) : null,
    };
    try {
      await couponsApi.create(payload);
      showSuccess('Coupon created');
      setForm(empty);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponsApi.remove(id);
      showSuccess('Coupon deleted');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const formatDiscount = (c) => {
    if (c.discountPercent != null) return `${c.discountPercent}% off`;
    if (c.discountAmount != null) return `$${Number(c.discountAmount).toFixed(2)} off`;
    return '—';
  };

  return (
    <div>
      <h2>Coupons</h2>
      <p className="muted">Demo: SAVE10 (10% off, min $50), WELCOME5 ($5 off, min $25)</p>
      <form className="admin-form card-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Code
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label>
            Value
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label>
            Min order ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">Create coupon</button>
      </form>
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Min order</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.code}</strong></td>
              <td>{formatDiscount(c)}</td>
              <td>${Number(c.minOrderAmount || 0).toFixed(2)}</td>
              <td>{c.active ? 'Yes' : 'No'}</td>
              <td>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
