import { Navigate, useLocation } from 'react-router-dom';

const LearnerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');
  const location = useLocation();

  if (!token || role !== 'Learner') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default LearnerProtectedRoute;