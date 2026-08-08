import api, { normalizeApiResponse } from "../../../../utils/api";

/**
 * UC-60 Step 1-4: Expert khởi tạo phiên simulation.
 * POST /api/expert/simulations/start
 * @param {{ expertId: string, materialId: string }} payload
 */
export async function startSimulation(payload) {
  const res = await api.post("/expert/simulations/start", payload);
  // Endpoint trả { simulationSessionId, message } trực tiếp (không dùng ResponseDto)
  return res.data;
}

/**
 * UC-60 Step 5-9: Gửi tin nhắn tương tác với AI.
 * POST /api/expert/simulations/{sessionId}/submit
 * @param {string} sessionId
 * @param {string} userPrompt
 */
export async function submitSimulationPrompt(sessionId, userPrompt) {
  const res = await api.post(`/expert/simulations/${sessionId}/submit`, {
    userPrompt,
  });
  return res.data; // PromptSubmissionDto trực tiếp
}

/**
 * UC-60 Step 12-14: Kết thúc simulation & lấy kết quả đánh giá.
 * POST /api/expert/simulations/{sessionId}/finish
 * @param {string} sessionId
 */
export async function finishSimulation(sessionId) {
  const res = await api.post(`/expert/simulations/${sessionId}/finish`);
  return res.data; // CompleteAttemptResponseDto trực tiếp
}

/**
 * Lấy chi tiết phiên simulation đã hoàn thành (xem lại kết quả).
 * GET /api/expert/simulations/{sessionId}
 * @param {string} sessionId
 */
export async function getSimulationDetail(sessionId) {
  const res = await api.get(`/expert/simulations/${sessionId}`);
  return res.data; // PracticeAttemptDto trực tiếp
}
