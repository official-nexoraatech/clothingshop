import { useAuth } from '../context/authState';
import { NavLink, Outlet } from 'react-router-dom';
import { employeeMenu } from '../data/navigation';

export default function EmployeeLayout() { const { logout } = useAuth();
  return (
    <div className="admin-shell employee-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">L</span>
          <div>
            <strong>Lavella Ops</strong>
            <small>Employee portal</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {employeeMenu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/customer' || item.to === '/employee'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav><NavLink className="nav-item" to="/products">Shop products</NavLink><button className="secondary-button" onClick={logout}>Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>Employee Dashboard</h2>
          </div>
          <div className="header-actions">
            <NavLink className="secondary-button" to="/employee/orders">Orders</NavLink>
            <NavLink className="primary-button" to="/employee/notifications">Alerts</NavLink>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

