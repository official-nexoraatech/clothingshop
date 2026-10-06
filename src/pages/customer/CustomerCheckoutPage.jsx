import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authState';
export default function CustomerCheckoutPage() {
  const { request } = useAuth(), navigate = useNavigate();
  const [addresses, setAddresses] = useState([]), [addressId, setAddressId] = useState(''), [couponCode, setCouponCode] = useState('');
  const [summary, setSummary] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { request('/addresses').then(x => { setAddresses(x.addresses); setAddressId(x.addresses.find(a => a.isDefault)?._id || x.addresses[0]?._id || ''); }).catch(e => setError(e.message)); }, [request]);
  const review = async e => { e.preventDefault(); setError(''); setBusy(true); setSummary(null); try { setSummary(await request('/checkout/summary', { method: 'POST', body: JSON.stringify({ addressId, couponCode }) })); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const place = async () => { setBusy(true); setError(''); try { const { order } = await request('/orders', { method: 'POST', body: JSON.stringify({ addressId, couponCode, paymentMethod: 'COD' }) }); navigate(`/customer/orders/${order._id}`, { replace: true }); } catch (e) { setError(e.message); setSummary(null); } finally { setBusy(false); } };
  return <form className="page-content container-inner phase7-page" onSubmit={review}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="panel-card"><h3>Delivery address</h3>{addresses.map(a => <label className="address-option" key={a._id}><input type="radio" name="address" checked={addressId === a._id} disabled={busy} onChange={() => { setAddressId(a._id); setSummary(null); }} /><span><strong>{a.fullName}</strong><br />{a.line1}, {a.city}, {a.state} — {a.postalCode}</span></label>)}{!addresses.length && <Link to="/customer/addresses">Add a delivery address</Link>}</div>
    <div className="panel-card"><label>Coupon code <input value={couponCode} disabled={busy} onChange={e => { setCouponCode(e.target.value); setSummary(null); }} /></label></div>
    <button className="primary-button" disabled={!addressId || busy}>{busy ? 'Please wait…' : 'Review checkout'}</button>
    {summary && <div className="summary-card panel-card"><h3>Order summary</h3>{summary.items.map(i => <p key={i.variant}>{i.productName} · {i.size} / {i.color} × {i.quantity} — ₹{i.subtotal.toFixed(2)}</p>)}{[['Subtotal', summary.subtotal], ['Coupon discount', -summary.discount], ['Shipping', summary.shipping], ['Total', summary.total]].map(([label, value]) => <div className="summary-row" key={label}><span>{label}</span><strong>₹{value.toFixed(2)}</strong></div>)}<p>Cash on Delivery — pay ₹{summary.total.toFixed(2)} when your order arrives.</p><button type="button" className="primary-button" disabled={busy} onClick={place}>{busy ? 'Placing order…' : 'Place order · Cash on Delivery'}</button></div>}
  </form>;
}
