import api from "../../../utils/api";

/** Gọi endpoint phân trang, trả PageResult<T> hoặc ném lỗi có message tiếng Việt. */
async function getPage(url, pageIndex, pageSize) {
  const res = await api.get(url, { params: { pageIndex, pageSize } });
  if (res.data?.success) return res.data.data;
  throw new Error(res.data?.errorMessage || "Không thể tải dữ liệu. Vui lòng thử lại.");
}

/** GET /api/profile/learner/me/courses */
export const getMyCourses = (pageIndex, pageSize = 10) =>
  getPage("/profile/learner/me/courses", pageIndex, pageSize);

/** GET /api/profile/learner/me/quiz-history */
export const getMyQuizHistory = (pageIndex, pageSize = 10) =>
  getPage("/profile/learner/me/quiz-history", pageIndex, pageSize);

/** GET /api/profile/learner/me/ai-scenarios (hiện trả trang rỗng) */
export const getMyAiScenarios = (pageIndex, pageSize = 10) =>
  getPage("/profile/learner/me/ai-scenarios", pageIndex, pageSize);
