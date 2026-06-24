import { Outlet } from 'react-router-dom';
import ExpertHeader from '../components/ExpertHeader/ExpertHeader';
import Footer from '../components/Footer/Footer';

const ExpertLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <ExpertHeader />
    <main style={{ flex: 1 }}>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default ExpertLayout;