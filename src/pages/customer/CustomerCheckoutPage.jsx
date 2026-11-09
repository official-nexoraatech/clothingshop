import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authState';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerCheckoutPage() {
  const { request } = useAuth(), navigate = useNavigate();
  const [addresses, setAddresses] = useState([]), [addressId, setAddressId] = useState(''), [couponCode, setCouponCode] = useState('');
  const [summary, setSummary] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    let active = true;
    request('/addresses').then((result) => {
      if (!active) return;
      const items = result.addresses || [];
      setAddresses(items);
      setAddressId(items.find((address) => address.isDefault)?._id || items[0]?._id || '');
    }).catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoadingAddresses(false); });
    return () => { active = false; };
  }, [request]);

  const reviewOrder = async (event) => {
    event.preventDefault();
    setError(''); setBusy(true); setSummary(null);
    try { setSummary(await request('/checkout/summary', { method: 'POST', body: JSON.stringify({ addressId, couponCode }) })); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };

  const placeOrder = async () => {
    setBusy(true); setError('');
    try {
      const { order } = await request('/orders', { method: 'POST', body: JSON.stringify({ addressId, couponCode, paymentMethod: 'COD' }) });
      window.dispatchEvent(new Event('cart-updated'));
      navigate(`/customer/orders/${order._id}`, { replace: true });
    } catch (failure) { setError(failure.message); setSummary(null); }
    finally { setBusy(false); }
  };

  return <form className="page-content container-inner checkout-page" onSubmit={reviewOrder}>
    <div className="checkout-heading"><div><p className="eyebrow">Almost yours</p><h1>Checkout</h1></div><Link to="/customer/cart">Back to bag</Link></div>
    <ol className="checkout-steps" aria-label="Checkout steps">
      <li className={!summary ? 'is-current' : 'is-complete'}><span>01</span> Delivery address</li>
      <li className={summary ? 'is-current' : ''}><span>02</span> Payment</li>
      <li><span>03</span> Review &amp; place order</li>
    </ol>

    {error && <p className="form-error" role="alert">{error}</p>}

    <div className="checkout-layout">
      <div className="checkout-main">
        <section className="panel-card checkout-panel">
          <div className="checkout-panel-heading"><span>01</span><div><h2>Delivery address</h2><p>Choose where you’d like your order sent.</p></div></div>
          {loadingAddresses && <p role="status">Loading your addresses…</p>}
          {!loadingAddresses && addresses.map((address) => <label className="address-option" key={address._id}>
            <input type="radio" name="address" value={address._id} checked={addressId === address._id} disabled={busy} onChange={() => { setAddressId(address._id); setSummary(null); }} />
            <span><strong>{address.fullName}</strong><br />{address.line1}, {address.city}, {address.state} — {address.postalCode}</span>
          </label>)}
          {!loadingAddresses && !addresses.length && <p>No delivery address saved yet. <Link to="/customer/addresses">Add an address</Link> to continue.</p>}
        </section>

        <section className="panel-card checkout-panel">
          <div className="checkout-panel-heading"><span>02</span><div><h2>Payment</h2><p>Available for this checkout: Cash on Delivery.</p></div></div>
          <div className="checkout-payment-method"><span className="checkout-radio is-selected" aria-hidden="true" /><span><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span><span className="checkout-payment-mark">COD</span></div>
        </section>

        <section className="panel-card checkout-panel">
          <div className="checkout-panel-heading"><span>03</span><div><h2>Review your order</h2><p>Check the total and apply a coupon, if you have one.</p></div></div>
          <label className="coupon-field">Coupon code<input value={couponCode} disabled={busy} onChange={(event) => { setCouponCode(event.target.value); setSummary(null); }} placeholder="Enter code" autoComplete="off" /></label>
        </section>

        <button className="primary-button checkout-review-button" disabled={!addressId || busy || loadingAddresses}>{busy ? 'Please wait…' : 'Review checkout'}</button>
      </div>

      <aside className="summary-card checkout-summary">
        <h2>Order summary</h2>
        {!summary ? <p>Your order total will appear after you review the order.</p> : <>
          <div className="checkout-summary-items">{summary.items.map((item) => <div className="checkout-summary-item" key={item.variant}><span>{item.productName}<small>{item.size} / {item.color} × {item.quantity}</small></span><strong>{money(item.subtotal)}</strong></div>)}</div>
          {[['Subtotal', summary.subtotal], ['Coupon discount', -summary.discount], ['Shipping', summary.shipping], ['Total', summary.total]].map(([label, value]) => <div className={`summary-row ${label === 'Total' ? 'total' : ''}`} key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}
          <p className="checkout-payment-note">Payment method: Cash on Delivery</p>
          <button type="button" className="primary-button full-width" disabled={busy} onClick={placeOrder}>{busy ? 'Placing order…' : 'Place order · Cash on Delivery'}</button>
        </>}
      </aside>
    </div>
  </form>;
}
