import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../utils/role';

/**
 * Bảo vệ các route chỉ dành cho Expert.
 * Kiểm tra accessToken + role lưu trong localStorage.
 */
const ExpertProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const role  = normalizeRole(localStorage.getItem('role'));

  if (!token || role !== 'Expert') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ExpertProtectedRoute;
