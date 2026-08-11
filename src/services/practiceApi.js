import api from "@services/api";

/**
 * UC-27 Step 4: Tạo phiên luyện tập mới.
 * POST /api/practice/attempts
 * @param {{ enrollmentId: string, materialId: string }} payload
 */
export async function createAttempt(payload) {
  const res = await api.post("/practice/attempts", payload);
  // Trả { id: guid }
  return res.data;
}

/**
 * UC-27 Step 5-9: Gửi tin nhắn tương tác với AI.
 * POST /api/practice/attempts/{attemptId}/submit
 * @param {string} attemptId
 * @param {string} userPrompt
 */
export async function submitPrompt(attemptId, userPrompt) {
  const res = await api.post(`/practice/attempts/${attemptId}/submit`, {
    userPrompt,
  });
  return res.data; // PromptSubmissionDto
}

/**
 * UC-27 Step 12-14 / AF-05: Hoàn thành phiên luyện tập, nhận kết quả AI.
 * POST /api/practice/attempts/{id}/complete
 * @param {string} attemptId
 */
export async function completeAttempt(attemptId) {
  const res = await api.post(`/practice/attempts/${attemptId}/complete`);
  return res.data; // CompleteAttemptResponseDto
}

/**
 * AF-07: Bỏ dở phiên luyện tập.
 * POST /api/practice/attempts/{id}/abandon
 * @param {string} attemptId
 */
export async function abandonAttempt(attemptId) {
  await api.post(`/practice/attempts/${attemptId}/abandon`);
}

/**
 * UC-28: Lấy chi tiết phiên luyện tập (bao gồm kết quả AI nếu đã hoàn thành).
 * GET /api/practice/attempts/{id}
 * @param {string} attemptId
 */
export async function getAttemptDetail(attemptId) {
  const res = await api.get(`/practice/attempts/${attemptId}`);
  return res.data; // PracticeAttemptDto
}

/**
 * Lấy danh sách phiên luyện tập theo enrollment.
 * GET /api/practice/attempts/by-enrollment/{enrollmentId}
 * @param {string} enrollmentId
 */
export async function listAttempts(enrollmentId) {
  const res = await api.get(
    `/practice/attempts/by-enrollment/${enrollmentId}`
  );
  return res.data; // List<PracticeAttemptDto>
}

/**
 * Lấy thông tin kịch bản (scenario) của material.
 * GET /api/practice/materials/{id}
 * @param {string} materialId
 */
export async function getPracticeMaterialDetail(materialId) {
  const res = await api.get(`/practice/materials/${materialId}`);
  return res.data; // AIPracticeMaterialDetailDto
}
