import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import AdminLayout from "../layout/AdminLayout";
import ExpertLayout from "../layout/ExpertLayout";
import AdminLogin from "../pages/Admin/AdminLogin/AdminLogin";
import UserManagement from "../pages/Admin/UserManagement/UserManagement";
import TagManagement from "../pages/Admin/TagManagement/TagManagement";
import ReportManagement from "../pages/Admin/ReportManagement/ReportManagement";
import CategoryManagement from "../pages/Admin/CategoryManagement/CategoryManagement";
import ExpertLogin from "../pages/Expert/ExpertLogin/ExpertLogin";
import ExpertProfile from "../pages/Expert/ExpertProfile/ExpertProfile";
import ExpertHome from "../pages/Expert/ExpertHome/ExpertHome";
import ExpertCourseManagement from "../pages/Expert/ExpertCourseManagement/ExpertCourseManagement";
import ModuleManagement from "../pages/Expert/ModuleManagement/ModuleManagement";
import ExpertAiResourceUsage from "../pages/Expert/ExpertAiResourceUsage/ExpertAiResourceUsage";
import Notifications from "../pages/Notifications/Notifications";
import CourseList from "../pages/Courses/CourseList";
import CourseDetail from "../pages/Courses/CourseDetail";
import BlogDetail from "../pages/BlogDetail/BlogDetail";
import LearnerProfile from "../pages/Learner/LearnerProfile/LearnerProfile";
import PageNotFound from "../pages/PageNotFound";
import Home from "../pages/Home/Home";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ExpertProtectedRoute from "./ExpertProtectedRoute";
import LearnerProtectedRoute from "./LearnerProtectedRoute";
import LearningView from "../pages/Learner/LearningView/LearningView";
import GoogleCallback from "../pages/Learner/GoogleCallback/GoogleCallback";
import BlogList from '../pages/BlogList/BlogList';
import PublicExpertProfile from '../pages/Learner/PublicExpertProfile/PublicExpertProfile';
import QuizTakingPage from "../pages/Learner/Quiz/QuizTakingPage";
import QuizResultPage from "../pages/Learner/Quiz/QuizResultPage";
import QuizResultDetailPage from "../pages/Learner/Quiz/QuizResultDetailPage";
import CoursesPage from "../pages/Learner/LearningProfile/CoursesPage";
import QuizHistoryPage from "../pages/Learner/LearningProfile/QuizHistoryPage";
import AiScenariosPage from "../pages/Learner/LearningProfile/AiScenariosPage";
import BlogManagement from "../pages/Admin/BlogManagement/BlogManagement";
import SubscriptionPlanManagement from "../pages/Admin/SubscriptionPlanManagement/SubscriptionPlanManagement";
import SubscriptionPlans from "../pages/Learner/SubscriptionPlans/SubscriptionPlans";
import SubscriptionResourceUsage from "../pages/Learner/SubscriptionResourceUsage/SubscriptionResourceUsage";

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
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <div style={{ padding: 48 }}>
            <h2>Admin Dashboard</h2>
            <p>Chọn chức năng bên dưới để quản lý người dùng hoặc tags.</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              <a href="/admin/users" style={{ padding: '14px 22px', background: '#2563eb', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                Quản lý người dùng
              </a>
              <a href="/admin/tags" style={{ padding: '14px 22px', background: '#1d4ed8', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                Quản lý tags
              </a>
              <a href="/admin/reports" style={{ padding: '14px 22px', background: '#0f766e', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                Review reports
              </a>
              <a href="/admin/categories" style={{ padding: '14px 22px', background: '#7c3aed', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                Quản lý category
              </a>
              <a href="/admin/subscription-plans" style={{ padding: '14px 22px', background: '#b45309', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
                Quản lý gói đăng ký
              </a>
            </div>
          </div>
        ),
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "tags",
        element: <TagManagement />,
      },
      {
        path: "reports",
        element: <ReportManagement />,
      },
      {
        path: "categories",
        element: <CategoryManagement />,
      },
      {
        path: "blogs",
        element: <BlogManagement />,
      },
      {
        path: "subscription-plans",
        element: <SubscriptionPlanManagement />,
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
      { index: true, element: <ExpertHome /> },
      { path: "profile", element: <ExpertProfile /> },
      { path: "courses", element: <ExpertCourseManagement /> },
      { path: "courses/:courseId/modules", element: <ModuleManagement /> },
      { path: "ai-resource-usage", element: <ExpertAiResourceUsage /> },
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
      { path: 'subscription-plans', element: <SubscriptionPlans /> },

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
        path: "profile/courses",
        element: (
          <LearnerProtectedRoute>
            <CoursesPage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "profile/quiz-history",
        element: (
          <LearnerProtectedRoute>
            <QuizHistoryPage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "profile/ai-scenarios",
        element: (
          <LearnerProtectedRoute>
            <AiScenariosPage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "profile/subscription-usage",
        element: (
          <LearnerProtectedRoute>
            <SubscriptionResourceUsage />
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
