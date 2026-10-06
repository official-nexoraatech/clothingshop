import { publicMenu } from '../data/navigation';
import { useShop } from '../context/shopState';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/authState';

export function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <p>Free shipping on orders above ₹2,999 • New arrivals this week •Limited-time members offer</p>
    </div>
  );
}

export function Navbar() {
  const { settings } = useShop();
  const navigate = useNavigate();
  const { user, logout, request } = useAuth();
  const [search, setSearch] = useState('');
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (user) request('/notifications/unread-count').then(data => setUnread(data.count)).catch(() => setUnread(0)); }, [user, request]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <header className="top-header">
      <div className="container nav-container">
        <Link to="/" className="brand-logo">
          <span className="brand-mark">{settings?.name?.[0] || 'S'}</span>
          <div>
            <span className="brand-name">{settings?.name || 'Shop'}</span>
            <small>Clothing store</small>
          </div>
        </Link>

        <nav className="main-nav">
          {publicMenu.slice(0, 6).map((item) => (
            <NavLink key={`${item.label}-${item.to}`} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-tools">
          <form className="nav-search" onSubmit={submitSearch} role="search">
            <input className="search-box" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" />
          </form>
          <Link to="/customer/wishlist" className="icon-button" aria-label="Wishlist">♡</Link>
          <Link to="/customer/cart" className="icon-button" aria-label="Cart">🛒</Link>
          {user && <Link to={user.role === 'admin' ? '/admin/notifications' : user.role === 'employee' ? '/employee/notifications' : '/customer/notifications'} className="icon-button" aria-label={`${unread} unread notifications`}>🔔{unread ? ` ${unread}` : ''}</Link>}
          {user ? <button type="button" className="primary-button" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button> : <Link to="/login" className="primary-button">Account</Link>}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { settings } = useShop();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">Men</Link></li>
            <li><Link to="/products">Women</Link></li>
            <li><Link to="/products">Kids</Link></li>
          </ul>
        </div>
        <div>
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4>Social</h4>
          <ul>
            <li>Instagram</li>
            <li>Facebook</li>
            <li>Pinterest</li>
          </ul>
        </div>
        <div>
          <h4>Account updates</h4>
          <p>View your notifications and manage contact preferences in your account.</p>
          <Link to="/customer/settings">Manage preferences</Link>
        </div>
      </div>
      <div className="container footer-base">
        <span>© 2026 {settings?.name || 'Shop'}</span>
      </div>
    </footer>
  );
}

export function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 && <span className="separator">/</span>}
          {item}
        </span>
      ))}
    </nav>
  );
}

export function StatCard({ label, value, change, tone = 'neutral' }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span className={`stat-change ${tone}`}>{change}</span>
    </div>
  );
}

export function Badge({ children, tone = 'default' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`custom-button ${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function ProductCard({ product: input }) {
  const { request, user } = useAuth(), navigate = useNavigate();
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const product = input._id && typeof input.brand !== 'string' ? { ...input, id: input._id, image: input.images?.[0]?.url, brand: input.brand?.name || '', rating: input.ratingSummary?.average || 0, reviewCount: input.ratingSummary?.count || 0, originalPrice: input.price, price: input.effectivePrice ?? input.price } : input;
  const wish = async () => { if (!user) return navigate('/login'); if (busy) return; setBusy(true); try { await request('/wishlist', { method: 'POST', body: JSON.stringify({ productId: product.id }) }); setNotice('Saved to your wishlist.'); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}><img src={product.image || '/product-placeholder.svg'} alt={product.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.svg'; }} /></Link>
        <button className="wishlist-button" aria-label={'Save ' + product.name + ' to wishlist'} disabled={busy} onClick={wish}>♡</button>{notice && <p role="status">{notice}</p>}
      </div>
      <div className="product-card-body">
        <div className="row-between"><span className="brand-name-small">{product.brand}</span><span className="rating">★ {product.rating}</span></div>
        <h4><Link to={`/products/${product.id}`}>{product.name}</Link></h4>
        <div className="price-row">
          <strong>₹{product.price}</strong>
          <span>₹{product.originalPrice}</span>
          <em>({product.discount}% off)</em>
        </div>
        <small>{product.reviewCount} reviews</small>
        {typeof product.inStock === 'boolean' && <span className={`badge ${product.inStock ? 'success' : 'warning'}`}>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>}
      </div>
    </article>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

