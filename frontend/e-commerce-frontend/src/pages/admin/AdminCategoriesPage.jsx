import { useEffect, useState } from 'react';
import { categoriesApi } from '../../api/categories';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => categoriesApi.list().then(setCategories);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = { name, description };
      if (editingId) {
        await categoriesApi.update(editingId, data);
      } else {
        await categoriesApi.create(data);
      }
      setName('');
      setDescription('');
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || '');
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Manage categories</h2>
      {error && <p className="alert alert-error">{error}</p>}
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          {editingId ? 'Update' : 'Create'}
        </button>
        {editingId && (
          <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setName(''); setDescription(''); }}>
            Cancel
          </button>
        )}
      </form>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.description}</td>
              <td>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>Edit</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
