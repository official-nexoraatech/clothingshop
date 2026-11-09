import { useAuth } from '../context/authState';
import { useShop } from '../context/shopState';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { adminMenu } from '../data/navigation';

export default function AdminLayout() { const { logout } = useAuth();
  const { settings } = useShop();
  const { pathname } = useLocation();
  const title = adminMenu.find(item => item.to === pathname)?.label || 'Administration';
  return (
    <div className="admin-shell admin-ui-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">{settings?.name?.[0] || 'S'}</span>
          <div>
            <strong>{settings?.name || 'Shop'} Admin</strong>
            <small>Operations center</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {adminMenu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav><NavLink className="nav-item" to="/products">Shop products</NavLink><button className="secondary-button" onClick={logout}>Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">System overview</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={logout}>Logout</button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

