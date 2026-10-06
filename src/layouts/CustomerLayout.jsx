import { useAuth } from '../context/authState';
import { NavLink, Outlet } from 'react-router-dom';
import { customerMenu } from '../data/navigation';

export default function CustomerLayout() { const { logout } = useAuth();
  return (
    <div className="admin-shell customer-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">L</span>
          <div>
            <strong>Lavella</strong>
            <small>Customer Portal</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {customerMenu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/customer' || item.to === '/employee'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav><NavLink className="nav-item" to="/products">Shop products</NavLink><button className="secondary-button" onClick={logout}>Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Customer area</p>
            <h2>My Account</h2>
          </div>
          <div className="header-actions">
            <NavLink className="secondary-button" to="/products">Search</NavLink>
            <NavLink className="primary-button" to="/customer/profile">Profile</NavLink>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

