import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authState';
const workflow = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
const nextStatus = { Pending: 'Confirmed', Confirmed: 'Processing', Processing: 'Shipped', Shipped: 'Out for Delivery', 'Out for Delivery': 'Delivered' };
export function Pagination({ pagination, onPage }) {
  if (!pagination) return null;
  return <div className="row-between"><button className="secondary-button" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.totalItems} results</span><button className="secondary-button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>Next</button></div>;
}
export function OrderDetails({ orderId, onChange }) {
  const { request, user } = useAuth(), [order, setOrder] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('');
  const load = useCallback(() => request(`/orders/${orderId}`).then(x => setOrder(x.order)), [request, orderId]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  const action = async (path, body) => { setBusy(true); setError(''); try { await request(path, { method: 'PATCH', body: JSON.stringify(body) }); await load(); onChange?.(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const change = status => action(`/orders/${orderId}/${user.role === 'customer' ? 'cancel' : 'status'}`, { status, note });
  return <div className="panel-card">{error && <p className="form-error" role="alert">{error}</p>}{!order ? <p>{error ? 'Order unavailable.' : 'Loading order…'}</p> : <>
    <h3>{order.orderNumber}</h3><p>{new Date(order.createdAt).toLocaleString()} · <strong>{order.status}</strong></p>
    <p>Payment: {order.payment?.method} · {order.paymentStatus}{order.status === 'Returned' && order.paymentStatus === 'Paid' ? ' · Cash refund pending' : ''}</p>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Variant / SKU</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>{order.items.map(i => <tr key={i._id}><td>{i.productName}</td><td>{i.size} / {i.color} · {i.sku}</td><td>{i.quantity}</td><td>₹{i.unitPrice.toFixed(2)}</td><td>₹{i.subtotal.toFixed(2)}</td></tr>)}</tbody></table></div>
    <p>Subtotal ₹{order.subtotal.toFixed(2)} · Discount ₹{order.discount.toFixed(2)} · Shipping ₹{order.shipping.toFixed(2)} · <strong>Total ₹{order.grandTotal.toFixed(2)}</strong></p>
    <h4>Delivery address</h4><p>{order.shippingAddress.snapshot.fullName} · {order.shippingAddress.snapshot.phone}<br />{['line1', 'line2', 'city', 'state', 'postalCode', 'country'].map(k => order.shippingAddress.snapshot[k]).filter(Boolean).join(', ')}</p>
    <h4>Status history</h4><ol>{order.statusHistory.map((h, i) => <li key={i}>{h.previousStatus ? `${h.previousStatus} → ` : ''}{h.status} · {new Date(h.changedAt).toLocaleString()}{h.note && ` — ${h.note}`}</li>)}</ol>
    <label>Note (optional)<input value={note} maxLength={500} onChange={e => setNote(e.target.value)} disabled={busy} /></label>
    <div className="cta-row">{user.role !== 'customer' && nextStatus[order.status] && <button className="primary-button" disabled={busy} onClick={() => change(nextStatus[order.status])}>{nextStatus[order.status] === 'Delivered' ? 'Confirm delivery & cash collected' : `Mark ${nextStatus[order.status]}`}</button>}
    {user.role !== 'employee' && ['Pending', 'Confirmed', 'Processing'].includes(order.status) && <button className="secondary-button" disabled={busy} onClick={() => change('Cancelled')}>Cancel order</button>}
    {user.role === 'admin' && order.status === 'Delivered' && <button className="secondary-button" disabled={busy} onClick={() => change('Returned')}>Confirm return received & restock</button>}
    {user.role === 'admin' && order.status === 'Returned' && order.paymentStatus === 'Paid' && <button className="secondary-button" disabled={busy} onClick={() => action(`/payments/${orderId}/refund`, { confirmed: true })}>Confirm cash refund issued</button>}</div>
    {user.role === 'customer' && order.status === 'Delivered' && <p>Returns are recorded by shop staff after the items are received.</p>}
  </>}</div>;
}
export function OrdersPage() {
  const [searchParams] = useSearchParams();
  const { request, user } = useAuth(), [data, setData] = useState(null), [page, setPage] = useState(1), [status, setStatus] = useState(''), [selected, setSelected] = useState(() => searchParams.get('order') || ''), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(() => request(`/orders${user.role === 'customer' ? '/my-orders' : ''}?page=${page}&status=${encodeURIComponent(status)}`).then(result => { setData(result); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false)), [request, user.role, page, status]);
  useEffect(() => { load(); }, [load]);
  return <div className="page-content container-inner phase7-page"><label>Order status <select value={status} onChange={e => { setLoading(true); setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{workflow.map(s => <option key={s}>{s}</option>)}</select></label>{error && <p role="alert" className="form-error">{error}</p>}{loading ? <p>Loading orders…</p> : <><div className="table-wrap"><table><thead><tr><th>Order</th><th>Date / Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Details</th></tr></thead><tbody>{data?.orders.map(o => <tr key={o._id}><td>{o.orderNumber}</td><td>{new Date(o.createdAt).toLocaleDateString()}<br />{user.role !== 'customer' && `${o.user?.name || 'Customer'} · ${o.user?.email || ''}`}</td><td>₹{o.grandTotal.toFixed(2)}</td><td>{o.paymentStatus}</td><td><span className="badge">{o.status}</span></td><td>{user.role === 'customer' ? <Link className="text-link" to={`/customer/orders/${o._id}`}>View</Link> : <button className="secondary-button" onClick={() => setSelected(o._id)}>Manage</button>}</td></tr>)}</tbody></table></div>{!data?.orders.length && <p>No orders found.</p>}<Pagination pagination={data?.pagination} onPage={value => { setLoading(true); setPage(value); }} /></>}{selected && <OrderDetails key={selected} orderId={selected} onChange={load} />}</div>;
}
export function CustomerOrderPage() { const { id } = useParams(); return <div className="page-content container-inner phase7-page"><Link to="/customer/orders">All orders</Link><OrderDetails key={id} orderId={id} /></div>; }
