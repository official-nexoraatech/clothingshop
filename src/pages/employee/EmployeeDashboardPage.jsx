import { Link } from 'react-router-dom';
import { StatCard } from '../../components/Common';
import { useAdminData } from '../../hooks/useAdminData';
export default function EmployeeDashboardPage() {
  const orders = useAdminData('/orders?limit=5'), low = useAdminData('/inventory?status=low&limit=1'), out = useAdminData('/inventory?status=out&limit=1');
  const results = [orders, low, out];
  return <div className="page-content container-inner">
    {results.some(x => x.loading) && <p role="status">Loading operations…</p>}
    {results.some(x => x.error) && <div role="alert"><p>Unable to load operations.</p><button onClick={() => results.forEach(x => x.retry())}>Retry</button></div>}
    <div className="stats-grid"><StatCard label="Total Orders" value={orders.data?.pagination.totalItems ?? '—'} /><StatCard label="Low Stock" value={low.data?.pagination.totalItems ?? '—'} /><StatCard label="Out of Stock" value={out.data?.pagination.totalItems ?? '—'} /></div>
    <section className="panel-card"><h3>Recent orders</h3>{orders.data?.orders.length ? <ul className="list-stack">{orders.data.orders.map(order => <li className="list-row" key={order._id}><span>{order.orderNumber}</span><strong>{order.user?.name || 'Customer'}</strong><span>{order.status}</span></li>)}</ul> : orders.data && <p>No orders yet.</p>}<Link to="/employee/orders">Manage orders</Link></section>
  </div>;
}

