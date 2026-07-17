import api from "../../../utils/api";

export async function getSystemTags(params = {}) {
  const res = await api.get("/admin/tags/system", { params });
  return res.data;
}

export async function createSystemTag(payload) {
  const res = await api.post("/admin/tags/system", payload);
  return res.data;
}

export async function updateSystemTag(tagId, payload) {
  const res = await api.put(`/admin/tags/system/${tagId}`, payload);
  return res.data;
}

export async function deleteSystemTag(tagId) {
  const res = await api.delete(`/admin/tags/system/${tagId}`);
  return res.data;
}

export async function getPendingTagVerificationRequests(params = {}) {
  const res = await api.get("/admin/tags/pending", { params });
  return res.data;
}

export async function getPendingTagVerificationDetail(tagId) {
  const res = await api.get(`/admin/tags/pending/${tagId}`);
  return res.data;
}

export async function reviewTagVerificationRequest(tagId, payload) {
  const res = await api.post(`/admin/tags/${tagId}/verify`, payload);
  return res.data;
}
