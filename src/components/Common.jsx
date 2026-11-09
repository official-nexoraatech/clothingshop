import { useShop } from '../context/shopState';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/authState';

export function AnnouncementBar() {
  return <div className="announcement-bar"><p>New season, new favourites. Find your next fit.</p></div>;
}

export function Navbar() {
  const { settings } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, request } = useAuth();
  const [search, setSearch] = useState('');
  const [unread, setUnread] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRoot = useRef(null);
  const [navCategories, setNavCategories] = useState([]);
  const [navBrands, setNavBrands] = useState([]);
  const [navProducts, setNavProducts] = useState([]);
  useEffect(() => {
    if (!user) { setUnread(0); setCartCount(0); return; }
    request('/notifications/unread-count').then(data => setUnread(data.count || 0)).catch(() => setUnread(0));
    const refreshCart = () => request('/cart').then(data => setCartCount((data.cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0))).catch(() => setCartCount(0));
    if (user.role === 'customer') refreshCart();
    window.addEventListener('cart-updated', refreshCart);
    return () => window.removeEventListener('cart-updated', refreshCart);
  }, [user, request]);
  useEffect(() => {
    let active = true;
    Promise.allSettled([request('/categories'), request('/brands'), request('/products?limit=24&sort=newest')]).then(([categoryResult, brandResult, productResult]) => {
      if (!active) return;
      setNavCategories(categoryResult.status === 'fulfilled' ? categoryResult.value.categories || [] : []);
      setNavBrands(brandResult.status === 'fulfilled' ? brandResult.value.brands || [] : []);
      setNavProducts(productResult.status === 'fulfilled' ? productResult.value.products || [] : []);
    });
    return () => { active = false; };
  }, [request]);

  useEffect(() => {
    if (!activeDropdown) return undefined;
    const closeOutside = (event) => { if (!dropdownRoot.current?.contains(event.target)) setActiveDropdown(null); };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setActiveDropdown(null); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [activeDropdown]);
  useEffect(() => { setActiveDropdown(null); }, [location.pathname, location.search, location.hash]);
  const toggleDropdown = (name) => setActiveDropdown((current) => current === name ? null : name);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <header className="top-header">
      <div className={`container nav-container${user ? ' has-user' : ''}`}>
        <Link to="/" className="brand-logo">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" focusable="false">
              <path className="brand-mark-hanger" d="M22.2 10.8a3 3 0 1 1 4.3 2.7c-1.1.6-1.8 1.2-1.8 2.7" />
              <path className="brand-mark-hanger" d="M24.3 18.3 5.8 31.1c-1.7 1.2-.8 3.8 1.3 3.8h34c2.1 0 3-2.6 1.3-3.8L24.3 18.3Z" />
              <path className="brand-mark-garment" d="m17.1 23.3 7.2 3.1 7.1-3.1-2.1 5.2 5.4 6.4H13.8l5.4-6.4-2.1-5.2Z" />
              <path className="brand-mark-detail" d="M24.3 27v7.1m-7.8 1.4h15.6" />
            </svg>
          </span>
          <div>
            <span className="brand-name">{settings?.name || 'Lavella'}</span>
            <small>Clothing store</small>
          </div>
        </Link>

        <button type="button" className="mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? 'Close' : 'Menu'}</button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} id="primary-navigation" ref={dropdownRoot}>
          <NavLink to="/products" onClick={() => { setMenuOpen(false); setActiveDropdown(null); }} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Shop</NavLink>
          <Link to={navProducts.some((product) => product.isNewArrival) ? "/#new-arrivals" : "/products?sort=newest"} className="nav-link" onClick={() => setMenuOpen(false)}>New arrivals</Link>
          {navProducts.some((product) => product.isTrending) && <Link to="/#trending" className="nav-link" onClick={() => setMenuOpen(false)}>Trending</Link>}
          <div className={`nav-category-dropdown ${activeDropdown === 'categories' ? 'is-active' : ''}`}>
            <button type="button" className={`nav-link nav-dropdown-trigger ${activeDropdown === 'categories' ? 'active' : ''}`} aria-expanded={activeDropdown === 'categories'} aria-controls="categories-mega-menu" onClick={() => toggleDropdown('categories')}>Categories</button>
            {activeDropdown === 'categories' && <div className="nav-mega-menu" id="categories-mega-menu"><div className="nav-mega-heading"><div><span>Explore Our Collections</span><small>FIND YOUR PERFECT STYLE</small></div><Link to="/products" onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}>View all <span aria-hidden="true">â†—</span></Link></div><div className="nav-mega-grid nav-category-grid">{navCategories.map((category) => <Link key={category._id} to={`/products?category=${category._id}`} onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}><span className="nav-mega-icon" aria-hidden="true">{category.name.slice(0, 1).toUpperCase()}</span><span>{category.name}</span><span className="nav-mega-arrow" aria-hidden="true">â†—</span></Link>)}{!navCategories.length && <Link to="/products" onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}>Shop all</Link>}</div></div>}
          </div>
          <div className={`nav-category-dropdown ${activeDropdown === 'brands' ? 'is-active' : ''}`}>
            <button type="button" className={`nav-link nav-dropdown-trigger ${activeDropdown === 'brands' ? 'active' : ''}`} aria-expanded={activeDropdown === 'brands'} aria-controls="brands-mega-menu" onClick={() => toggleDropdown('brands')}>Brands</button>
            {activeDropdown === 'brands' && <div className="nav-mega-menu nav-brands-menu" id="brands-mega-menu"><div className="nav-mega-heading"><div><span>Discover Our Brands</span><small>EXPLORE PREMIUM LABELS</small></div><Link to="/products" onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}>View all <span aria-hidden="true">â†—</span></Link></div><div className="nav-mega-grid nav-brand-grid">{navBrands.map((brand) => <Link key={brand._id} to={`/products?brand=${brand._id}`} onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}><span className="nav-brand-initial" aria-hidden="true">{brand.name.slice(0, 1).toUpperCase()}</span><span>{brand.name}</span><span className="nav-mega-arrow" aria-hidden="true">â†—</span></Link>)}{!navBrands.length && <Link to="/products" onClick={() => { setMenuOpen(false); setActiveDropdown(null); }}>Shop all</Link>}</div></div>}
          </div>
          <NavLink to="/about" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>About</NavLink>
        </nav>

        <div className={`nav-tools ${menuOpen ? 'is-open' : ''}${user ? ' has-user' : ''}`}>
          <form className="nav-search" onSubmit={submitSearch} role="search">
            <svg className="nav-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <input className="search-box" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" />
          </form>
          <div className={`nav-actions${user ? ' is-authenticated' : ''}`}>
          <Link to="/customer/wishlist" className="icon-button nav-tool-link wishlist-nav-link" aria-label="Wishlist"><svg className="wishlist-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg><span className="nav-tool-label">Wishlist</span></Link>
          <Link to="/customer/cart" className="icon-button nav-tool-link nav-bag" aria-label={`Shopping bag, ${cartCount} items`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span className="nav-tool-label">Bag</span>{user?.role === 'customer' && <span className="cart-count">{cartCount}</span>}</Link>
          {user && <Link to={user.role === 'admin' ? '/admin/notifications' : user.role === 'employee' ? '/employee/notifications' : '/customer/notifications'} className="icon-button nav-tool-link nav-alert-link" aria-label={`Alerts, ${unread} unread`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span className="nav-tool-label">Alerts</span>{unread > 0 && <span className="alert-count">{unread}</span>}</Link>}
          {user ? <Link to={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/employee' : '/customer'} className="account-link nav-tool-link"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg><span className="nav-tool-label">Account</span></Link> : <Link to="/login" className="account-link nav-tool-link"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg><span className="nav-tool-label">Sign in</span></Link>}
          </div>
          {user && <button type="button" className="primary-button nav-logout" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { settings } = useShop();
  const { request } = useAuth();
  const [categories, setCategories] = useState([]);
  const hasConfiguredContacts = settings && !(settings.email === 'support@lavella.example' && settings.phone === '+91 98765 43210' && settings.location === 'Bengaluru, India');
  useEffect(() => { let active = true; request('/categories').then((data) => { if (active) setCategories(data.categories || []); }).catch(() => {}); return () => { active = false; }; }, [request]);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All products</Link></li>
            {categories.slice(0, 6).map((category) => <li key={category._id}><Link to={`/products?category=${category._id}`}>{category.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4>Need a hand?</h4>
          <ul>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms &amp; conditions</Link></li>
            <li><Link to="/about">About {settings?.name || 'us'}</Link></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul className="footer-contact-list">
            {hasConfiguredContacts && settings.location && <li>{settings.location}</li>}
            {hasConfiguredContacts && settings.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {hasConfiguredContacts && settings.phone && <li><a href={`tel:${settings.phone}`}>{settings.phone}</a></li>}
            {!hasConfiguredContacts && <li><Link to="/contact">Get in touch</Link></li>}
          </ul>
        </div>
        <div>
          <h4>Your account</h4>
          <ul><li><Link to="/login">Sign in</Link></li><li><Link to="/customer/orders">My orders</Link></li><li><Link to="/customer/wishlist">Wishlist</Link></li><li><Link to="/customer/cart">Shopping bag</Link></li></ul>
        </div>
      </div>
      <div className="container footer-base">
        <span>&#169; {settings?.name || 'Lavella'}, {new Date().getFullYear()}</span>
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
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [variantId, setVariantId] = useState('');
  const product = input._id && typeof input.brand !== 'string' ? { ...input, id: input._id, image: input.images?.[0]?.url, brand: input.brand?.name || '', rating: input.ratingSummary?.average || 0, reviewCount: input.ratingSummary?.count || 0, originalPrice: input.price, price: input.effectivePrice ?? input.price } : input;
  const wish = async () => { if (!user) return navigate('/login'); if (busy) return; setBusy(true); try { await request('/wishlist', { method: 'POST', body: JSON.stringify({ productId: product.id }) }); setNotice('Saved to your wishlist.'); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const addToCart = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'customer') { setNotice('Sign in with a customer account to shop.'); return; }
    if (!variantId) { setNotice('Choose a size and colour first.'); return; }
    setBusy(true); setNotice('');
    try { await request('/cart/items', { method: 'POST', body: JSON.stringify({ productId: product.id, variantId, quantity: 1 }) }); setNotice('Added to your bag.'); window.dispatchEvent(new Event('cart-updated')); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}><img className="product-image-primary" src={product.image || '/product-placeholder.svg'} alt={product.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.svg'; }} />{product.images?.[1]?.url && <img className="product-image-secondary" src={product.images[1].url} alt={`${product.name}, alternate view`} loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />}</Link>
        {product.isNewArrival && <span className="product-tag">New</span>}
        {Number(product.discount) > 0 && <span className="product-sale-tag">Sale</span>}
        <button className="wishlist-button" aria-label={`Save ${product.name} to wishlist`} disabled={busy} onClick={wish}>&#9825;</button>
      </div>
      <div className="product-card-body">
        <div className="row-between"><span className="brand-name-small">{product.brand}</span>{product.reviewCount > 0 && <span className="rating">&#9733; {product.rating} <small>({product.reviewCount})</small></span>}</div>
        <h4><Link to={`/products/${product.id}`}>{product.name}</Link></h4>
        <div className="price-row"><strong>&#8377;{Number(product.price || 0).toLocaleString('en-IN')}</strong>{Number(product.discount) > 0 && <><span>&#8377;{Number(product.originalPrice || 0).toLocaleString('en-IN')}</span><em>{product.discount}% off</em></>}</div>
        {product.variants?.length > 0 && <label className="quick-add-select">Size &amp; colour<select aria-label={`Choose size and colour for ${product.name}`} value={variantId} onChange={(event) => setVariantId(event.target.value)}><option value="">Choose an option</option>{product.variants.map((variant) => <option key={variant._id} value={variant._id} disabled={variant.stock < 1}>{variant.size} / {variant.color}{variant.stock < 1 ? ' (Out of stock)' : ''}</option>)}</select></label>}
        <button type="button" className="product-card-add primary-button" onClick={addToCart} disabled={busy || product.inStock === false}>{busy ? 'Adding...' : 'Add to bag'}</button>
        {typeof product.inStock === 'boolean' && <span className={`badge ${product.inStock ? 'success' : 'warning'}`}>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>}
        {notice && <p role="status" className="product-card-notice">{notice}</p>}
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

