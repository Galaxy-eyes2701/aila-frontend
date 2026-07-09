import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import ExpertLayout from "../layout/ExpertLayout";
import AdminLogin from "../pages/AdminLogin/AdminLogin";
import ExpertLogin from "../pages/ExpertLogin/ExpertLogin";
import ExpertProfile from "../pages/ExpertProfile/ExpertProfile";
import ModuleManagement from "../pages/ModuleManagement/ModuleManagement";
import Notifications from "../pages/Notifications/Notifications";
import CourseList from "../pages/Courses/CourseList";
import CourseDetail from "../pages/Courses/CourseDetail";
import BlogDetail from "../pages/BlogDetail/BlogDetail";
import LearnerProfile from "../pages/LearnerProfile/LearnerProfile";
import PageNotFound from "../pages/PageNotFound";
import Home from "../pages/Home/Home";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ExpertProtectedRoute from "./ExpertProtectedRoute";
import LearnerProtectedRoute from "./LearnerProtectedRoute";
import LearningView from "../pages/LearningView/LearningView";
import GoogleCallback from '../pages/GoogleCallback/GoogleCallback';
import BlogList from '../pages/BlogList/BlogList';
import PublicExpertProfile from '../pages/PublicExpertProfile/PublicExpertProfile';
import QuizTakingPage from "../pages/Quiz/QuizTakingPage";
import QuizResultPage from "../pages/Quiz/QuizResultPage";
import QuizResultDetailPage from "../pages/Quiz/QuizResultDetailPage";

const router = createBrowserRouter([
  // ── Auth pages (không có Header) ─────────────────────────────
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/expert/login", element: <ExpertLogin /> },
  { path: '/auth/google/callback', element: <GoogleCallback /> },

  // ── Admin ─────────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <div style={{ minHeight: "100vh", background: "#f7f3eb" }} />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <div style={{ padding: 48 }}>
            <h2>Admin Dashboard</h2>
          </div>
        ),
      },
    ],
  },

  // ── Expert ────────────────────────────────────────────────────
  {
    path: "/expert",
    element: (
      <ExpertProtectedRoute>
        <ExpertLayout />
      </ExpertProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/expert/profile" replace /> },
      { path: "profile", element: <ExpertProfile /> },
      { path: "courses/:courseId/modules", element: <ModuleManagement /> },
      { path: "notifications", element: <Notifications /> },
    ],
  },

  // ── Public + Learner (dùng chung MainLayout) ──────────────────
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ── PUBLIC: Guest + Learner đều xem được ──
      { index: true, element: <Home /> },
      { path: "courses", element: <CourseList /> },
      { path: "courses/:id", element: <CourseDetail /> },
      { path: "experts/:expertId", element: <PublicExpertProfile /> },
      { path: "blogs/:id", element: <BlogDetail /> },
      { path: 'blogs', element: <BlogList /> },

      // ── PROTECTED: Chỉ Learner đã đăng nhập ──
      {
        path: "profile",
        element: (
          <LearnerProtectedRoute>
            <LearnerProfile />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <LearnerProtectedRoute>
            <Notifications />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "learning/:courseId",
        element: (
          <LearnerProtectedRoute>
            <LearningView />
          </LearnerProtectedRoute>
        ),
      },

      // ── Quiz (UC-26 làm bài, UC-27 xem kết quả) ──
      {
        path: "courses/:courseId/materials/:materialId/quiz",
        element: (
          <LearnerProtectedRoute>
            <QuizTakingPage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "courses/:courseId/materials/:materialId/quiz/result",
        element: (
          <LearnerProtectedRoute>
            <QuizResultPage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "courses/:courseId/materials/:materialId/quiz/result/detail",
        element: (
          <LearnerProtectedRoute>
            <QuizResultDetailPage />
          </LearnerProtectedRoute>
        ),
      },

      { path: "*", element: <PageNotFound /> },
    ],
    
  },
]);

const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
