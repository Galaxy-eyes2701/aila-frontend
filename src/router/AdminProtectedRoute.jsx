import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../utils/role';

const AdminProtectedRoute = ({ children }) => {
  const token          = localStorage.getItem('accessToken');
  const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  const role           = normalizeRole(localStorage.getItem('role'));

  if (!token || !isAdminLoggedIn || role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;