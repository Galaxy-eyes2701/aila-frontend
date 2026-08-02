import api from "../../../utils/api";

// ===== Expert =====

/**
 * Expert lấy danh sách yêu cầu xem xét lại của mình.
 */
export async function getMyReReviewRequests() {
  const res = await api.get("/experts/me/course-review-requests");
  return res.data;
}

/**
 * Expert gửi yêu cầu xem xét lại khóa học bị khoá.
 */
export async function submitReReviewRequest(courseId, reason) {
  const res = await api.post("/experts/me/course-review-requests", {
    courseId,
    reason,
  });
  return res.data;
}

// ===== Admin =====

/**
 * Admin lấy danh sách tất cả yêu cầu, filter theo status.
 * @param {string|undefined} status - "Pending" | "Approved" | "Rejected" | undefined
 */
export async function getAdminReReviewRequests(status) {
  const params = {};
  if (status) params.status = status;
  const res = await api.get("/admin/course-review-requests", { params });
  return res.data;
}

/**
 * Admin phê duyệt yêu cầu — unlock + publish lại course.
 */
export async function approveReReviewRequest(requestId, reviewComment) {
  const res = await api.patch(
    `/admin/course-review-requests/${requestId}/approve`,
    { reviewComment: reviewComment || null }
  );
  return res.data;
}

/**
 * Admin từ chối yêu cầu — course vẫn bị khoá, kèm lý do bắt buộc.
 */
export async function rejectReReviewRequest(requestId, reviewComment) {
  const res = await api.patch(
    `/admin/course-review-requests/${requestId}/reject`,
    { reviewComment }
  );
  return res.data;
}
