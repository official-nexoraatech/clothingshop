import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authState';

const initial = { sku: '', size: '', color: '', stock: '0', price: '', status: 'active' };
export default function ProductVariants({ productId, onChange }) {
  const { request } = useAuth();
  const [variants, setVariants] = useState([]), [form, setForm] = useState(initial), [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    request(`/products/${productId}`).then(({ product }) => { if (active) setVariants(product.variants); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, productId, revision]);
  const update = (key, value) => setForm(x => ({ ...x, [key]: value }));
  const save = async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setNotice('');
    try {
      const body = { sku: form.sku, size: form.size, color: form.color,
        ...(editing ? { status: form.status, price: form.price === '' ? null : Number(form.price) } : { stock: Number(form.stock), ...(form.price !== '' ? { price: Number(form.price) } : {}) }) };
      await request(`/products/${productId}/variants${editing ? `/${editing}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setForm(initial); setEditing(null); setNotice('Variant saved.'); setRevision(x => x + 1); onChange();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="catalog-editor variant-editor"><h3>Sizes, colours & variants</h3>
    <p>Create a variant so customers can select a size and colour. Existing stock changes are recorded in <Link to="/admin/inventory">Inventory</Link>.</p>
    {error && <p role="alert" className="form-error">{error} <button onClick={() => { setError(''); setLoading(true); setRevision(x => x + 1); }}>Retry</button></p>}
    {notice && <p role="status" className="catalog-success">{notice}</p>}
    {loading ? <p>Loading variants…</p> : <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Size / colour</th><th>Stock</th><th>Price override</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {variants.map(v => <tr key={v._id}><td>{v.sku}</td><td>{v.size} / {v.color}</td><td>{v.stock}</td><td>{v.price == null ? 'Product price' : `₹${v.price.toFixed(2)}`}</td><td>{v.status}</td><td><button disabled={busy} className="text-link" onClick={() => { setEditing(v._id); setForm({ sku: v.sku, size: v.size, color: v.color, stock: String(v.stock), price: v.price == null ? '' : String(v.price), status: v.status }); }}>Edit variant</button></td></tr>)}
      {!variants.length && <tr><td colSpan="6">No variants yet. Add the first size and colour below.</td></tr>}
    </tbody></table></div>}
    <form onSubmit={save}><fieldset disabled={busy}><h4>{editing ? 'Edit variant' : 'Add variant'}</h4><div className="product-form-grid">
      <label>SKU *<input name="sku" required value={form.sku} onChange={e => update('sku', e.target.value)}/></label>
      <label>Size *<input name="size" required maxLength={30} value={form.size} onChange={e => update('size', e.target.value)}/></label>
      <label>Colour *<input name="color" required maxLength={50} value={form.color} onChange={e => update('color', e.target.value)}/></label>
      {!editing && <label>Initial stock *<input name="stock" required type="number" min="0" step="1" value={form.stock} onChange={e => update('stock', e.target.value)}/></label>}
      <label>Price override (optional)<input name="variantPrice" type="number" min="0" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} placeholder="Use product price"/></label>
      {editing && <label>Variant status<select value={form.status} onChange={e => update('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></label>}
    </div><div className="editor-actions"><button className="primary-button">{busy ? 'Saving…' : editing ? 'Save variant' : 'Add variant'}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(null); setForm(initial); }}>Cancel variant editing</button>}</div></fieldset></form>
  </section>;
}
