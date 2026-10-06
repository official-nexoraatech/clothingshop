import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/authState';

export default function CustomerCartPage() {
  const { request } = useAuth();
  const [cart, setCart] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(() => request('/cart').then(result => { setCart(result.cart); setError(''); }).catch(e => setError(e.message)), [request]);
  useEffect(() => { load(); }, [load]);
  const change = async (path, method, body) => {
    setBusy(true); setError('');
    try { const result = await request(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }); setCart(result.cart); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const shipping = cart?.items.length ? (cart.subtotal >= 2999 ? 0 : 149) : 0;
  return <div className="page-content container-inner">
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="secondary-button" disabled={busy} onClick={load}>Refresh bag</button>
    {!cart ? <p>{error ? 'Your bag could not be loaded. Please retry.' : 'Loading your bag…'}</p> : <div className="cart-layout">
      <div className="cart-items">{cart.items.map(item => <div key={item.id} className="cart-item panel-card">
        <img src={item.product?.images?.[0]?.url || 'https://placehold.co/300x400?text=Product'} alt={item.product?.name || 'Unavailable product'} />
        <div><h4>{item.product?.name || 'Unavailable product'}</h4><p>Size: {item.variant?.size || '—'} · Color: {item.variant?.color || '—'}</p>
          {item.issue && <p className="form-error" role="status">{item.issue}</p>}
          <div className="qty-actions"><button aria-label="Decrease quantity" disabled={busy || item.quantity <= 1 || !item.variant?.stock} onClick={() => change(`/cart/items/${item.id}`, 'PATCH', { quantity: Math.min(item.quantity - 1, item.variant.stock) })}>-</button><span>{item.quantity}</span><button aria-label="Increase quantity" disabled={busy || !item.available || item.quantity >= item.variant?.stock} onClick={() => change(`/cart/items/${item.id}`, 'PATCH', { quantity: item.quantity + 1 })}>+</button></div>
        </div>
        <div className="cart-price"><strong>₹{item.lineTotal.toFixed(2)}</strong><button className="text-link" disabled={busy} onClick={() => change(`/cart/items/${item.id}`, 'DELETE')}>Remove</button></div>
      </div>)}{!cart.items.length && <div className="panel-card empty-state"><h3>Your bag is empty</h3><Link className="primary-button" to="/products">Browse products</Link></div>}</div>
      <aside className="summary-card panel-card"><h3>Order Summary</h3><div className="summary-row"><span>Subtotal</span><strong>₹{cart.subtotal.toFixed(2)}</strong></div><div className="summary-row"><span>Shipping</span><strong>{shipping ? `₹${shipping}` : 'Free'}</strong></div><div className="summary-row total"><span>Estimated total</span><strong>₹{(cart.subtotal + shipping).toFixed(2)}</strong></div>
        {cart.canCheckout && !busy ? <Link className="primary-button full-width" to="/customer/checkout">Continue to checkout</Link> : <><button className="primary-button full-width" disabled>Continue to checkout</button>{cart.items.length > 0 && <p>Resolve unavailable items before checkout.</p>}</>}
      </aside>
    </div>}
  </div>;
}
