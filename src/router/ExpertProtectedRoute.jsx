import { Navigate } from 'react-router-dom';

/**
 * Bảo vệ các route chỉ dành cho Expert.
 * Kiểm tra accessToken + role lưu trong localStorage.
 */
const ExpertProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');

  if (!token || role !== 'Expert') {
    return <Navigate to="/expert/login" replace />;
  }

  return children;
};

export default ExpertProtectedRoute;
