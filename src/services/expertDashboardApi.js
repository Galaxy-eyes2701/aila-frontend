import api from "@services/api";

/**
 * UC-65: Review Expert Dashboard
 * GET /api/experts/me/dashboard
 */
export async function getExpertDashboard({ courseId, reportingPeriod, startDate, endDate }) {
  const params = {};
  if (courseId) params.courseId = courseId;
  if (reportingPeriod) params.reportingPeriod = reportingPeriod;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await api.get("/experts/me/dashboard", { params });
  return res.data;
}
