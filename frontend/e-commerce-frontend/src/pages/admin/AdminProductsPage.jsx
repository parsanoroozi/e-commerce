import { useEffect, useState } from 'react';
import { categoriesApi } from '../../api/categories';
import { productsApi } from '../../api/products';
import { uploadsApi } from '../../api/uploads';
import { resolveImageUrl } from '../../utils/imageUrl';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  imageUrl: '',
  categoryId: '',
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [prodData, catData] = await Promise.all([
      productsApi.adminList(),
      categoriesApi.list(),
    ]);
    setProducts(prodData.content || prodData);
    setCategories(catData);
    if (catData.length && !form.categoryId) {
      setForm((f) => ({ ...f, categoryId: String(catData[0].id) }));
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const payload = () => ({
    name: form.name,
    description: form.description,
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
    imageUrl: form.imageUrl || null,
    categoryId: Number(form.categoryId),
    active: form.active,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await productsApi.update(editingId, payload());
        setMessage('Product updated');
      } else {
        await productsApi.create(payload());
        setMessage('Product created');
      }
      setForm(emptyProduct);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId),
      active: p.active,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadsApi.uploadProductImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      setMessage('Image uploaded');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await productsApi.remove(id);
    await load();
  };

  return (
    <div>
      <h2>Manage products</h2>
      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
        <div className="form-grid">
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Price
            <input required type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <label>
            Stock
            <input required type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          </label>
          <label>
            Category
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="full-width">
            Product image
            <div className="image-upload-row">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <span className="muted">Uploading...</span>}
              {form.imageUrl && (
                <img src={resolveImageUrl(form.imageUrl)} alt="Preview" className="image-preview" />
              )}
            </div>
            <input
              className="image-url-fallback"
              placeholder="Or paste image URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </label>
          <label className="full-width">
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <label>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.categoryName}</td>
              <td>${Number(p.price).toFixed(2)}</td>
              <td>{p.stockQuantity}</td>
              <td>{p.active ? 'Yes' : 'No'}</td>
              <td>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => deactivate(p.id)}>Deactivate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
