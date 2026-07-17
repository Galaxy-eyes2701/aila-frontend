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
