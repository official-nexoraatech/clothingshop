import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/authState';
import { Pagination } from '../../components/Orders';
import ProductVariants from '../../components/ProductVariants';
const initial = { name: '', description: '', category: '', brand: '', price: '', discount: '0', status: 'draft', images: '' };
export default function AdminProductsPage() {
  const { request } = useAuth();
  const [products, setProducts] = useState([]), [masters, setMasters] = useState({ categories: [], brands: [] });
  const [form, setForm] = useState(initial), [editing, setEditing] = useState(null), [files, setFiles] = useState([]);
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1), [pagination, setPagination] = useState(null), [search, setSearch] = useState(''), [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
  const fileInput = useRef(null);
  const load = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    request(`/products?all=true&limit=20&page=${page}&search=${encodeURIComponent(query)}`).then(data => {
      if (active) { setProducts(data.products); setPagination(data.pagination); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, page, query, revision]);
  useEffect(() => {
    let active = true;
    Promise.all([request('/categories?all=true'), request('/brands?all=true')]).then(([c, b]) => {
      if (active) setMasters({ categories: c.categories, brands: b.brands });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [request, revision]);
  const update = (key, value) => setForm(x => ({ ...x, [key]: value }));
  const select = p => {
    setEditing(p); setFiles([]); if (fileInput.current) fileInput.current.value = '';
    setForm({ name: p.name, description: p.description, category: p.category?._id || p.category, brand: p.brand?._id || p.brand, price: String(p.price), discount: String(p.discount || 0), status: p.status, images: (p.images || []).map(i => i.url).join(', ') });
  };
  const reset = () => { setEditing(null); setForm(initial); setFiles([]); if (fileInput.current) fileInput.current.value = ''; };
  const save = async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setNotice('');
    let saved = false;
    try {
      const images = form.images.split(',').map(x => x.trim()).filter(Boolean).map((url, order) => ({ url, order, isPrimary: order === 0 }));
      if (images.length + files.length > 8) throw new Error('A product can have at most 8 images.');
      if (files.some(file => file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))) throw new Error('Choose JPEG, PNG, WebP or GIF images up to 5 MB each.');
      const { product } = await request(editing ? `/products/${editing._id}` : '/products', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...form, price: Number(form.price), discount: Number(form.discount), images }) });
      saved = true; setEditing(product);
      if (files.length) {
        const data = new FormData(); files.forEach(file => data.append('images', file));
        const uploaded = await request(`/products/${product._id}/images`, { method: 'POST', body: data });
        product.images = uploaded.images;
      }
      select(product); setNotice('Product saved. Manage its sizes and colours below.');
    } catch (e) { setError((saved ? 'Product saved, but image upload failed. Retry saving to upload the selected files. ' : '') + e.message); }
    finally { if (saved) load(); setBusy(false); }
  };
return <main className="page-content catalog-admin"><div className="catalog-heading"><div><p className="eyebrow">Catalog management</p><h2>Products</h2><p>Create, price and publish your store collection.</p></div><span className="catalog-count">{pagination ? `${pagination.totalItems} products` : 'Loading...'}</span></div>{notice&&<p role="status" className="catalog-success">{notice}</p>}{error&&<p role="alert" className="form-error">{error} <button type="button" onClick={()=>{setError('');setLoading(true);load()}}>Retry</button></p>}<form className="catalog-editor" onSubmit={save}><fieldset disabled={busy}><div className="editor-top"><div><h3>{editing?'Edit product':'Add a product'}</h3><p>Fields marked with * are required.</p></div>{editing&&<button type="button" className="text-link" onClick={reset}>Cancel editing</button>}</div><section><h4>Product information</h4><div className="product-form-grid"><label className="wide-field">Product name *<input required value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Classic Oxford Shirt"/></label><label>Category *<select required value={form.category} onChange={e=>update('category',e.target.value)}><option value="">Select category</option>{masters.categories.map(x=><option value={x._id} key={x._id}>{x.name}</option>)}</select></label><label>Brand *<select required value={form.brand} onChange={e=>update('brand',e.target.value)}><option value="">Select brand</option>{masters.brands.map(x=><option value={x._id} key={x._id}>{x.name}</option>)}</select></label><label className="wide-field">Description *<textarea required value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Describe the fabric, fit, and key details."/></label></div></section><section><h4>Pricing & availability</h4><div className="product-form-grid pricing-grid"><label>Base price *<input required type="number" step="0.01" min="0" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="0.00"/></label><label>Discount %<input type="number" step="0.01" min="0" max="100" value={form.discount} onChange={e=>update('discount',e.target.value)}/></label><label>Status<select value={form.status} onChange={e=>update('status',e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label></div></section><section className="image-section"><h4>Product images</h4><p>Add files from your computer, or use image URLs if you already host them online.</p><div className="image-inputs"><label className="file-drop">Choose image files<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={e=>setFiles([...e.target.files])}/><span>{files.length?`${files.length} file(s) selected`:'JPEG, PNG, WebP or GIF · max 5 MB each'}</span></label><label>Image URLs <small>optional, comma separated</small><input value={form.images} onChange={e=>update('images',e.target.value)} placeholder="https://example.com/product.jpg"/></label></div></section><div className="editor-actions"><button className="primary-button">{busy?'Saving...':editing?'Save changes':'Create product'}</button><span>{editing?'New selected files will be added to this product.':'You can edit variants after creating the product.'}</span></div></fieldset></form>{editing&&<ProductVariants key={editing._id} productId={editing._id} onChange={load}/>}<section className="catalog-list"><div className="list-heading"><h3>Your products</h3><span>{pagination?.totalItems ?? 0} total</span></div><form className="catalog-toolbar" onSubmit={e=>{e.preventDefault();setError('');setLoading(true);setPage(1);setQuery(search.trim());load()}}><label>Search products<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or description"/></label><button className="secondary-button">Search products</button></form>{loading?<p role="status">Loading products...</p>:<div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Images</th><th></th></tr></thead><tbody>{products.length?products.map(p=><tr key={p._id}><td><strong>{p.name}</strong><small>{p.brand?.name||'No brand'}</small></td><td>{p.category?.name||'—'}</td><td>₹{p.effectivePrice??p.price}</td><td><span className={`status-pill ${p.status}`}>{p.status}</span></td><td>{p.images?.length||0}</td><td><button disabled={busy} className="text-link" onClick={()=>select(p)}>Edit</button></td></tr>):<tr><td colSpan="6" className="empty-table">No matching products. Create a product or change your search.</td></tr>}</tbody></table></div>}{!loading&&<Pagination pagination={pagination} onPage={value=>{setLoading(true);setPage(value)}}/>}</section></main>}
