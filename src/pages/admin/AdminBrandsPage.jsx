import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/authState';
const initial = { name: '', description: '', logo: '', status: 'active' };
export default function AdminBrandsPage() {
  const { request } = useAuth();
  const [items, setItems] = useState([]), [form, setForm] = useState(initial), [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [error, setError] = useState(''), [loadError, setLoadError] = useState(''), [notice, setNotice] = useState(''), [deleting, setDeleting] = useState(null);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    request('/brands?all=true').then(data => { if (active) { setItems(data.brands); setLoadError(''); } })
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
    if (!form.name.trim()) { setError('Enter a brand name.'); setNotice(''); return; }
    const logo = form.logo.trim();
    if (logo) { try { const url = new URL(logo); if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error(); } catch { setError('Logo must be a valid http(s) URL.'); setNotice(''); return; } }
    mutate(() => request(editing ? `/brands/${editing}` : '/brands', {
      method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...form, logo, name: form.name.trim(), description: form.description.trim() })
    }), editing ? 'Brand updated.' : 'Brand created.', reset);
  };
  const toggle = item => mutate(() => request(`/brands/${item._id}`, {
    method: 'PATCH', body: JSON.stringify({ status: item.status === 'active' ? 'inactive' : 'active' })
  }), item.status === 'active' ? 'Brand deactivated.' : 'Brand activated.', () => { if (editing === item._id) reset(); });
  const remove = () => mutate(() => request(`/brands/${deleting._id}`, { method: 'DELETE' }), 'Brand deleted.', () => {
    if (editing === deleting._id) reset(); setDeleting(null);
  });
  return <div className="page-content container-inner catalog-admin brand-page">
    <p>Create and manage the brands available in your store.</p>
    {notice && <p className="catalog-success" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="catalog-editor" onSubmit={save}><fieldset disabled={busy || Boolean(deleting)}>
      <h3>{editing ? 'Edit brand' : 'Add a brand'}</h3>
      <div className="product-form-grid">
        <label>Brand name *<input name="brandName" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Peter England"/></label>
        <label>Logo URL (optional)<input name="brandLogo" type="url" value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="https://example.com/logo.png"/></label>
        <label>Status<select name="brandStatus" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="wide-field">Description (optional)<textarea name="brandDescription" maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      </div>
      <div className="editor-actions"><button className="primary-button">{busy ? 'Saving...' : editing ? 'Save brand' : 'Add brand'}</button>{editing && <button type="button" className="secondary-button" onClick={reset}>Cancel editing</button>}</div>
    </fieldset></form>
    {deleting && <section className="panel-card" role="region" aria-label="Confirm brand deletion">
      <h3>Delete {deleting.name}?</h3><p>This permanently removes the brand. Brands used by products cannot be deleted.</p>
      <div className="editor-actions"><button className="primary-button" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Confirm delete'}</button><button className="secondary-button" disabled={busy} onClick={() => setDeleting(null)}>Keep brand</button></div>
    </section>}
    <section aria-label="Brand list" aria-busy={loading}>
      {loading ? <p role="status">Loading brands...</p> : loadError ? <p className="form-error" role="alert">{loadError} <button className="secondary-button" onClick={refresh}>Retry loading</button></p> : !items.length ? <p>No brands yet. Add your first brand above.</p> : <div className="brand-grid">{items.map(item => <article className="panel-card brand-card" key={item._id}><BrandLogo url={item.logo} name={item.name}/><h4>{item.name}</h4>{item.description && <p>{item.description}</p>}<p>{item.status}</p><div className="brand-actions">
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => { setEditing(item._id); setForm({ name: item.name, description: item.description || '', logo: item.logo || '', status: item.status }); setError(''); setNotice(''); }}>Edit</button>
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => toggle(item)}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button className="text-link" disabled={busy || Boolean(deleting)} onClick={() => { setDeleting(item); setError(''); setNotice(''); }}>Delete</button>
        </div></article>)}</div>}
    </section>
  </div>;
}

function BrandLogo({ url, name }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return url && failedUrl !== url ? <img src={url} alt={`${name} logo`} onError={() => setFailedUrl(url)}/> : <div className="brand-badge" aria-label={`${name} logo unavailable`}>{name[0]}</div>;
}
