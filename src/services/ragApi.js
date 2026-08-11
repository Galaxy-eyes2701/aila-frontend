import api from "@services/api";

/**
 * UC-31 Step 2: Lấy session hiện có hoặc tạo mới (BR-01: 1 session per course).
 * POST /api/rag/sessions
 */
export async function getOrCreateChatSession(courseId) {
  const res = await api.post("/rag/sessions", {
    courseId,
    title: "Trợ lý học tập AI",
  });
  return res.data; // CourseChatSessionDto
}

/**
 * UC-31 Step 2: Lấy lịch sử tin nhắn của session.
 * GET /api/rag/sessions/{sessionId}/messages
 */
export async function getChatMessages(sessionId) {
  const res = await api.get(`/rag/sessions/${sessionId}/messages`);
  return res.data; // List<CourseChatMessageDto>
}

/**
 * UC-31 Step 3-7: Gửi câu hỏi và nhận trả lời từ AI.
 * POST /api/rag/sessions/{sessionId}/ask
 */
export async function askQuestion(sessionId, question) {
  const res = await api.post(`/rag/sessions/${sessionId}/ask`, { question });
  return res.data; // AskRagQuestionResponseDto
}
