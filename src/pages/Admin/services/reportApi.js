import api from "../../../utils/api";

export async function getAdminReports(params = {}) {
  const res = await api.get("/admin/reports", { params });
  return res.data;
}

export async function getReportDetail(reportId) {
  const res = await api.get(`/admin/reports/${reportId}`);
  return res.data;
}

export async function resolveAdminReport(reportId) {
  const res = await api.patch(`/admin/reports/${reportId}/resolve`);
  return res.data;
}

/**
 * Admin lock course liên quan đến report và resolve report cùng lúc.
 */
export async function lockCourseFromReport(reportId) {
  const res = await api.patch(`/admin/reports/${reportId}/lock-course`);
  return res.data;
}

/**
 * Admin gỡ khoá course để expert có thể publish lại.
 */
export async function unlockCourse(courseId) {
  const res = await api.patch(`/admin/courses/${courseId}/unlock`);
  return res.data;
}
