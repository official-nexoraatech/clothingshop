import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/authState';
const initial = { name: '', description: '', status: 'active' };
export default function AdminCategoriesPage() {
  const { request } = useAuth();
  const [items, setItems] = useState([]), [form, setForm] = useState(initial), [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [error, setError] = useState(''), [loadError, setLoadError] = useState(''), [notice, setNotice] = useState(''), [deleting, setDeleting] = useState(null);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    request('/categories?all=true').then(data => { if (active) { setItems(data.categories); setLoadError(''); } })
      .catch(e => { if (active) setLoadError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, revision]);
  const refresh = () => { setLoading(true); setRevision(value => value + 1); };
  const reset = () => { setEditing(null); setForm(initial); };
  const mutate = async (work, message, after) => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); after?.(); setNotice(message); refresh(); }
    catch (e) { setError(e.message); }
    finally { saving.current = false; setBusy(false); }
  };
  const save = e => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Enter a category name.'); setNotice(''); return; }
    mutate(() => request(editing ? `/categories/${editing}` : '/categories', {
      method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...form, name: form.name.trim(), description: form.description.trim() })
    }), editing ? 'Category updated.' : 'Category created.', reset);
  };
  const toggle = item => mutate(() => request(`/categories/${item._id}`, {
    method: 'PATCH', body: JSON.stringify({ status: item.status === 'active' ? 'inactive' : 'active' })
  }), item.status === 'active' ? 'Category deactivated.' : 'Category activated.', () => { if (editing === item._id) reset(); });
  const remove = () => mutate(() => request(`/categories/${deleting._id}`, { method: 'DELETE' }), 'Category deleted.', () => {
    if (editing === deleting._id) reset(); setDeleting(null);
  });
  return <div className="page-content container-inner catalog-admin category-page">
    <p>Create and manage the categories used to organise your products.</p>
    {notice && <p className="catalog-success" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="catalog-editor" onSubmit={save}><fieldset disabled={busy || Boolean(deleting)}>
      <h3>{editing ? 'Edit category' : 'Add a category'}</h3>
      <div className="product-form-grid">
        <label>Category name *<input name="categoryName" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Women"/></label>
        <label>Status<select name="categoryStatus" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="wide-field">Description (optional)<textarea name="categoryDescription" maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      </div>
      <div className="editor-actions"><button className="primary-button">{busy ? 'Saving...' : editing ? 'Save category' : 'Add category'}</button>{editing && <button type="button" className="secondary-button" onClick={reset}>Cancel editing</button>}</div>
    </fieldset></form>
    {deleting && <section className="panel-card" role="region" aria-label="Confirm category deletion">
      <h3>Delete {deleting.name}?</h3><p>This permanently removes the category. Categories used by products cannot be deleted.</p>
      <div className="editor-actions"><button className="primary-button" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Confirm delete'}</button><button className="secondary-button" disabled={busy} onClick={() => setDeleting(null)}>Keep category</button></div>
    </section>}
    <section aria-label="Category list" aria-busy={loading}>
      {loading ? <p role="status">Loading categories...</p> : loadError ? <p className="form-error" role="alert">{loadError} <button className="secondary-button" onClick={refresh}>Retry loading</button></p> : !items.length ? <p>No categories yet. Add your first category above.</p> : <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => <tr key={item._id}><td>{item.name}</td><td>{item.description || '-'}</td><td>{item.status}</td><td><div className="category-actions">
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => { setEditing(item._id); setForm({ name: item.name, description: item.description || '', status: item.status }); setError(''); setNotice(''); }}>Edit</button>
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => toggle(item)}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => { setDeleting(item); setError(''); setNotice(''); }}>Delete</button>
        </div></td></tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
