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
import BlogList from "../pages/BlogList/BlogList";
import PublicExpertProfile from "../pages/Learner/PublicExpertProfile/PublicExpertProfile";
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
import AccountResourceLimitManagement from "../pages/Admin/AccountResourceLimitManagement/AccountResourceLimitManagement";
import EvaluationRequestList from "../pages/Expert/ExpertEvaluation/EvaluationRequestList";
import EvaluationRequestDetail from "../pages/Expert/ExpertEvaluation/EvaluationRequestDetail";
import ExpertEvaluationResult from "../pages/Learner/ExpertEvaluation/ExpertEvaluationResult";
import ExpertSimulation from "../pages/Expert/ExpertSimulation/ExpertSimulation";
import AIPracticePage from "../pages/Learner/AIPractice/AIPracticePage";
import AIPracticeFeedbackPage from "../pages/Learner/AIPractice/AIPracticeFeedbackPage";

const router = createBrowserRouter([
  // ── Auth pages (không có Header) ─────────────────────────────
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/expert/login", element: <ExpertLogin /> },
  { path: "/auth/google/callback", element: <GoogleCallback /> },

  // ── Admin ─────────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/reports" replace /> },
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
      {
        path: "resource-limit-management",
        element: <AccountResourceLimitManagement />,
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
      // UC-63 / UC-64 — hàng chờ & chấm bài đánh giá
      { path: "evaluation-requests", element: <EvaluationRequestList /> },
      {
        path: "evaluation-requests/:requestId",
        element: <EvaluationRequestDetail />,
      },
      { path: "notifications", element: <Notifications /> },
      // UC-60 — Expert chạy thử AI Practice Simulation
      { path: "simulation/:materialId", element: <ExpertSimulation /> },
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
      { path: "blogs", element: <BlogList /> },
      { path: "subscription-plans", element: <SubscriptionPlans /> },

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
      // UC-30 — learner xem kết quả nhờ chuyên gia đánh giá
      {
        path: "learner/expert-evaluations/:requestId",
        element: (
          <LearnerProtectedRoute>
            <ExpertEvaluationResult />
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

      // ── AI Practice (UC-27 luyện tập, UC-28 xem kết quả) ──
      {
        path: "courses/:courseId/materials/:materialId/practice",
        element: (
          <LearnerProtectedRoute>
            <AIPracticePage />
          </LearnerProtectedRoute>
        ),
      },
      {
        path: "courses/:courseId/materials/:materialId/practice/:attemptId/feedback",
        element: (
          <LearnerProtectedRoute>
            <AIPracticeFeedbackPage />
          </LearnerProtectedRoute>
        ),
      },

      { path: "*", element: <PageNotFound /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
