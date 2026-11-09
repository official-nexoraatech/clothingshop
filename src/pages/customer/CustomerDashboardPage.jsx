import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authState';
import { useAdminData } from '../../hooks/useAdminData';
import { StatCard, ProductCard } from '../../components/Common';
export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const orders = useAdminData('/orders/my-orders?limit=4'), wishlist = useAdminData('/wishlist'), addresses = useAdminData('/addresses'), products = useAdminData('/products?limit=3');
  const results = [orders, wishlist, addresses, products];
  return <div className="page-content container-inner">
    {results.some(x => x.loading) && <p role="status">Loading account…</p>}
    {results.some(x => x.error) && <div role="alert"><p>Unable to load account data. Please try again.</p><button className="secondary-button" onClick={() => results.forEach(x => x.retry())}>Retry</button></div>}
    <div className="stats-grid"><StatCard label="Total Orders" value={orders.data?.pagination.totalItems ?? '—'} /><StatCard label="Wishlist" value={wishlist.data?.products.length ?? '—'} /><StatCard label="Saved addresses" value={addresses.data?.addresses.length ?? '—'} /></div>
    <div className="panel-grid two-col"><section className="panel-card"><h3>Recent Orders</h3>{orders.data?.orders.length ? <ul className="list-stack">{orders.data.orders.map(order => <li className="list-row" key={order._id}><Link to={'/customer/orders/' + order._id}>{order.orderNumber}</Link><span>{order.status}</span><strong>₹{order.grandTotal.toFixed(2)}</strong></li>)}</ul> : orders.data && <p>No orders yet.</p>}<Link to="/customer/orders">All orders</Link></section>
    <section className="panel-card"><h3>Account Summary</h3><p>{user.name}</p><p>Member since {new Date(user.createdAt).toLocaleDateString()}</p><Link to="/customer/profile">View profile</Link></section></div>
    <section className="section-block no-top"><div className="section-head row-between"><h3>Latest Products</h3><Link to="/products">View all</Link></div><div className="product-grid product-grid-compact">{products.data?.products.map(product => <ProductCard key={product._id} product={product} />)}</div>{products.data && !products.data.products.length && <p>No products available.</p>}</section>
  </div>;
}

