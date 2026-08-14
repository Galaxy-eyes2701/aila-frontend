import { Outlet } from 'react-router-dom';
import AdminHeader from '@presentation/components/AdminHeader/AdminHeader';
import Footer from '@presentation/components/Footer/Footer';

const AdminLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#e0f2fe' }}>
    <AdminHeader />
    <main style={{ flex: 1, background: '#e0f2fe' }}>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AdminLayout;
