import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout          from '../layout/MainLayout';
import ExpertLayout        from '../layout/ExpertLayout';
import AdminLogin          from '../pages/AdminLogin/AdminLogin';
import ExpertLogin         from '../pages/ExpertLogin/ExpertLogin';
import ExpertProfile       from '../pages/ExpertProfile/ExpertProfile';
import Notifications       from '../pages/Notifications/Notifications';
import CourseList          from '../pages/Courses/CourseList';
import CourseDetail        from '../pages/Courses/CourseDetail';
import BlogDetail          from '../pages/BlogDetail/BlogDetail';
import PageNotFound        from '../pages/PageNotFound';
import AdminProtectedRoute from './AdminProtectedRoute';
import ExpertProtectedRoute from './ExpertProtectedRoute';

const router = createBrowserRouter([

  // ── Trang login không có Header ──────────────────────────────
  { path: '/admin/login',  element: <AdminLogin /> },
  { path: '/expert/login', element: <ExpertLogin /> },

  // ── Admin routes — không có Header/Footer ────────────────────
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <div style={{ minHeight: '100vh', background: '#f7f3eb' }} />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <div style={{ padding: 48 }}><h2>Admin Dashboard — đang phát triển</h2></div>,
      },
    ],
  },

  // ── Expert routes — có ExpertHeader riêng ────────────────────
  {
    path: '/expert',
    element: (
      <ExpertProtectedRoute>
        <ExpertLayout />
      </ExpertProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/expert/profile" replace /> },
      { path: 'profile',       element: <ExpertProfile /> },
      { path: 'notifications', element: <Notifications /> },
    ],
  },

  // ── User/Learner routes — có Header thông thường ─────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,               element: <Navigate to="/" replace /> },
      { path: 'courses',           element: <CourseList /> },
      { path: 'courses/:id',       element: <CourseDetail /> },
      { path: 'notifications',     element: <Notifications /> },
      { path: '*',                 element: <PageNotFound /> },
      { path: 'blogs/:id',     element: <BlogDetail /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;