import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar, Navbar, Footer } from '../components/Common';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const authPage = /^\/(login|register|forgot-password|reset-password)\/?$/i.test(pathname);
  return (
    <div className={`app-shell public-shell${authPage ? ' auth-only-shell' : ''}`}>
      {!authPage && <><AnnouncementBar /><Navbar /></>}
      <main className={authPage ? 'auth-only-main' : undefined}>
        <Outlet />
      </main>
      {!authPage && <Footer />}
    </div>
  );
}
