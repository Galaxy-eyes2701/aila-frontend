import { Outlet } from 'react-router-dom';
import AdminHeader from '@presentation/components/AdminHeader/AdminHeader';
import Footer from '@presentation/components/Footer/Footer';

const AdminLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AdminHeader />
    <main style={{ flex: 1 }}>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AdminLayout;
