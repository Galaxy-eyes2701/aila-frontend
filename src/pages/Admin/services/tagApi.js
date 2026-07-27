import api from "../../../utils/api";

// Chuẩn hoá code giống hệt cách BE tự tính trong
// UpdateSystemTagCommandHandler/CreateSystemTagCommandHandler
// (name.Trim().ToLower().Replace(" ", "-"))
function toCode(name) {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export async function getSystemTags(params = {}) {
  // BE: [HttpGet("system/search")] — không có route "system" trần
  const res = await api.get("/admin/tags/system/search", { params });
  return res.data;
}

export async function createSystemTag(payload) {
  // BE: CreateSystemTagCommand(string Name)
  const res = await api.post("/admin/tags/system", { name: payload.name });
  return res.data;
}

export async function updateSystemTag(tagId, payload) {
  // BE: UpdateSystemTagCommand(Guid TagId, string Name, string Code)
  // Code là field bắt buộc (non-nullable) nên phải gửi kèm, dù handler
  // tự tính lại code từ Name chứ không dùng giá trị này để lưu.
  const res = await api.put(`/admin/tags/system/${tagId}`, {
    name: payload.name,
    code: toCode(payload.name),
  });
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
  // BE: ReviewTagVerificationCommand(Guid TagId, TagPublishRequestStatus Status, string? Note)
  // -> field lý do từ chối tên là "note", không phải "rejectionReason"
  const res = await api.post(`/admin/tags/${tagId}/verify`, {
    status: payload.status,
    note: payload.note,
  });
  return res.data;
}