import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';
export default function CustomerWishlistPage() {
  const { request } = useAuth(), list = useAdminData('/wishlist');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [choices, setChoices] = useState({});
  const act = async (id, move = false) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request('/wishlist/' + id + (move ? '/move-to-cart' : ''), move
        ? { method: 'POST', body: JSON.stringify({ variantId: choices[id] }) }
        : { method: 'DELETE' });
      setNotice(move ? 'Moved to cart.' : 'Removed from wishlist.'); list.retry();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <div className="page-content container-inner">
    {notice && <p role="status">{notice} <Link to="/customer/cart">View cart</Link></p>}
    {(error || list.error) && <div role="alert"><p className="form-error">{error || list.error}</p><button onClick={() => { setError(''); list.retry(); }}>Retry</button></div>}
    {list.loading ? <p role="status">Loading wishlist...</p> : <div className="product-grid product-grid-compact">
      {list.data?.products.map(item => <div key={item._id} className="product-card">
        <div className="product-image-wrap"><img src={item.images?.[0]?.url || '/product-placeholder.svg'} alt={item.name} /></div>
        <div className="product-card-body"><h4>{item.name}</h4><strong>₹{(item.price * (1 - (item.discount || 0) / 100)).toFixed(2)}</strong>
          <label>Size and colour for {item.name}<select value={choices[item._id] || ''} disabled={busy} onChange={e => setChoices({ ...choices, [item._id]: e.target.value })}>
            <option value="">Choose a variant</option>
            {item.variants?.map(variant => <option key={variant._id} value={variant._id} disabled={variant.stock < 1}>{variant.size} / {variant.color} — ₹{(variant.price ?? item.price * (1 - (item.discount || 0) / 100)).toFixed(2)}{variant.stock < 1 ? ' (out of stock)' : ''}</option>)}
          </select></label>
          {!item.variants?.some(v => v.stock > 0) && <p>Currently out of stock</p>}
          <div className="row-actions">
            <button className="primary-button small" disabled={busy || !choices[item._id]} onClick={() => act(item._id, true)}>Move to cart</button>
            <Link className="secondary-button small" to={'/products/' + item._id}>View product</Link>
            <button className="secondary-button small" disabled={busy} onClick={() => act(item._id)}>Remove</button>
          </div>
        </div>
      </div>)}
      {list.data && !list.data.products.length && <div className="panel-card empty-state"><h3>Your wishlist is empty</h3><Link className="primary-button" to="/products">Explore products</Link></div>}
    </div>}
  </div>;
}
