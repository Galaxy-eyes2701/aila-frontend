import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import MainLayout from "@presentation/layouts/MainLayout";
import AdminLayout from "@presentation/layouts/AdminLayout";
import ExpertLayout from "@presentation/layouts/ExpertLayout";
import AdminLogin from "@presentation/pages/Admin/AdminLogin/AdminLogin";
import UserManagement from "@presentation/pages/Admin/UserManagement/UserManagement";
import TagManagement from "@presentation/pages/Admin/TagManagement/TagManagement";
import ReportManagement from "@presentation/pages/Admin/ReportManagement/ReportManagement";
import CategoryManagement from "@presentation/pages/Admin/CategoryManagement/CategoryManagement";
import ExpertLogin from "@presentation/pages/Expert/ExpertLogin/ExpertLogin";
import ExpertProfile from "@presentation/pages/Expert/ExpertProfile/ExpertProfile";
import ExpertHome from "@presentation/pages/Expert/ExpertHome/ExpertHome";
import ExpertCourseManagement from "@presentation/pages/Expert/ExpertCourseManagement/ExpertCourseManagement";
import ModuleManagement from "@presentation/pages/Expert/ModuleManagement/ModuleManagement";
import ExpertAiResourceUsage from "@presentation/pages/Expert/ExpertAiResourceUsage/ExpertAiResourceUsage";
import Notifications from "@presentation/pages/Notifications/Notifications";
import CourseList from "@presentation/pages/Courses/CourseList";
import CourseDetail from "@presentation/pages/Courses/CourseDetail";
import BlogDetail from "@presentation/pages/BlogDetail/BlogDetail";
import LearnerProfile from "@presentation/pages/Learner/LearnerProfile/LearnerProfile";
import PageNotFound from "@presentation/pages/PageNotFound";
import Home from "@presentation/pages/Home/Home";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ExpertProtectedRoute from "./ExpertProtectedRoute";
import LearnerProtectedRoute from "./LearnerProtectedRoute";
import LearningView from "@presentation/pages/Learner/LearningView/LearningView";
import GoogleCallback from "@presentation/pages/Learner/GoogleCallback/GoogleCallback";
import BlogList from "@presentation/pages/BlogList/BlogList";
import PublicExpertProfile from "@presentation/pages/Learner/PublicExpertProfile/PublicExpertProfile";
import QuizTakingPage from "@presentation/pages/Learner/Quiz/QuizTakingPage";
import QuizResultPage from "@presentation/pages/Learner/Quiz/QuizResultPage";
import QuizResultDetailPage from "@presentation/pages/Learner/Quiz/QuizResultDetailPage";
import CoursesPage from "@presentation/pages/Learner/LearningProfile/CoursesPage";
import QuizHistoryPage from "@presentation/pages/Learner/LearningProfile/QuizHistoryPage";
import AiScenariosPage from "@presentation/pages/Learner/LearningProfile/AiScenariosPage";
import BlogManagement from "@presentation/pages/Admin/BlogManagement/BlogManagement";
import SubscriptionPlanManagement from "@presentation/pages/Admin/SubscriptionPlanManagement/SubscriptionPlanManagement";
import SubscriptionPlans from "@presentation/pages/Learner/SubscriptionPlans/SubscriptionPlans";
import SubscriptionResourceUsage from "@presentation/pages/Learner/SubscriptionResourceUsage/SubscriptionResourceUsage";
import AccountResourceLimitManagement from "@presentation/pages/Admin/AccountResourceLimitManagement/AccountResourceLimitManagement";
import EvaluationRequestList from "@presentation/pages/Expert/ExpertEvaluation/EvaluationRequestList";
import EvaluationRequestDetail from "@presentation/pages/Expert/ExpertEvaluation/EvaluationRequestDetail";
import ExpertEvaluationResult from "@presentation/pages/Learner/ExpertEvaluation/ExpertEvaluationResult";
import ExpertSimulation from "@presentation/pages/Expert/ExpertSimulation/ExpertSimulation";
import AIPracticePage from "@presentation/pages/Learner/AIPractice/AIPracticePage";
import AIPracticeFeedbackPage from "@presentation/pages/Learner/AIPractice/AIPracticeFeedbackPage";
import CurrentSubscription from "@presentation/pages/Learner/Subscription/CurrentSubscription";
import Checkout from "@presentation/pages/Learner/Subscription/Checkout";
import PaymentHistory from "@presentation/pages/Learner/Subscription/PaymentHistory";
import AdminActivityLogsPage from "@presentation/pages/Admin/AdminActivityLog/AdminActivityLogsPage";
import AIReports from "@presentation/pages/Admin/AIReports/AIReports";
import AIPricing from "@presentation/pages/Admin/AIPricing/AIPricing";
import PolicyViolations from "@presentation/pages/Admin/PolicyViolations/PolicyViolations";

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
      {
        path: "activity-logs",
        element: <AdminActivityLogsPage />,
      },
      {
        path: "ai-reports",
        element: <AIReports />,
      },
      {
        path: "ai-pricing",
        element: <AIPricing />,
      },
      {
        path: "policy-violations",
        element: <PolicyViolations />,
      },
      {
        path: "notifications",
        element: <Notifications />,
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
      { path: "my-courses", element: <ExpertCourseManagement /> },
      { path: "my-courses/:courseId", element: <ExpertCourseManagement /> },
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
      // UC-18: Xem gói đăng ký hiện tại
      {
        path: "profile/subscription",
        element: (
          <LearnerProtectedRoute>
            <CurrentSubscription />
          </LearnerProtectedRoute>
        ),
      },
      // UC-20: Lịch sử thanh toán
      {
        path: "profile/payment-history",
        element: (
          <LearnerProtectedRoute>
            <PaymentHistory />
          </LearnerProtectedRoute>
        ),
      },
      // UC-19: Trang thanh toán gói đăng ký
      {
        path: "subscription-plans/:planId/checkout",
        element: (
          <LearnerProtectedRoute>
            <Checkout />
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
