import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shippingAddressesApi } from '../api/shippingAddresses';

const emptyForm = {
  label: '',
  street: '',
  city: '',
  zipCode: '',
  country: '',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    shippingAddressesApi.list().then(setAddresses).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await shippingAddressesApi.update(editingId, form);
        setMessage('Address updated');
      } else {
        await shippingAddressesApi.create(form);
        setMessage('Address saved');
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await shippingAddressesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const makeDefault = async (id) => {
    try {
      await shippingAddressesApi.setDefault(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container page">
      <Link to="/checkout" className="back-link">
        &larr; Back to checkout
      </Link>
      <h1>Saved addresses</h1>
      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit address' : 'Add address'}</h2>
        <label>
          Label (optional)
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Home, Work..."
          />
        </label>
        <label>
          Street
          <input
            required
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
          />
        </label>
        <label>
          City
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
        <label>
          ZIP
          <input
            required
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
          />
        </label>
        <label>
          Country
          <input
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Set as default
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Save'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="address-list address-list-page">
        {addresses.map((addr) => (
          <li key={addr.id} className="address-card-static">
            <div>
              <strong>
                {addr.label || 'Address'}
                {addr.isDefault && <span className="address-badge">Default</span>}
              </strong>
              <p className="muted">
                {addr.street}, {addr.city}, {addr.zipCode}, {addr.country}
              </p>
            </div>
            <div className="address-actions">
              {!addr.isDefault && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => makeDefault(addr.id)}
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => startEdit(addr)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => remove(addr.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {addresses.length === 0 && (
        <p className="muted">No saved addresses yet. Add one above or at checkout.</p>
      )}
    </div>
  );
}
