import { Outlet } from 'react-router-dom';
import { AnnouncementBar, Navbar, Footer } from '../components/Common';

export default function PublicLayout() {
  return (
    <div className="app-shell public-shell">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
