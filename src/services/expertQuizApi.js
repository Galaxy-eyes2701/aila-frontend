import api, { resolveApiError, normalizeApiResponse } from "@services/api";
export { resolveApiError };

export const getQuizDetail = async (materialId) => {
  const response = await api.get(`/quiz-materials/${materialId}`);
  return normalizeApiResponse(response.data);
};

export const updateQuizDetail = async (materialId, payload) => {
  const response = await api.put(`/quiz-materials/${materialId}`, payload);
  return normalizeApiResponse(response.data);
};

// ===== Questions =====

export const getQuestions = async (quizMaterialId) => {
  const response = await api.get(`/quiz-materials/${quizMaterialId}/questions`);
  return normalizeApiResponse(response.data);
};

export const createQuestion = async (quizMaterialId, payload) => {
  const response = await api.post(`/quiz-materials/${quizMaterialId}/questions`, payload);
  return normalizeApiResponse(response.data);
};

export const updateQuestion = async (quizMaterialId, questionId, payload) => {
  const response = await api.put(`/quiz-materials/${quizMaterialId}/questions/${questionId}`, payload);
  return normalizeApiResponse(response.data);
};

export const deleteQuestion = async (quizMaterialId, questionId) => {
  const response = await api.delete(
    `/quiz-materials/${quizMaterialId}/questions/${questionId}`,
  );
  return { success: response.status === 204 };
};

export const reorderQuestions = async (quizMaterialId, items) => {
  const response = await api.put(`/quiz-materials/${quizMaterialId}/questions/reorder`, { items });
  return normalizeApiResponse(response.data);
};

// ===== Answer options =====

export const getAnswerOptions = async (questionId) => {
  const response = await api.get(`/questions/${questionId}/answer-options`);
  return normalizeApiResponse(response.data);
};

export const createAnswerOption = async (questionId, payload) => {
  const response = await api.post(`/questions/${questionId}/answer-options`, payload);
  return normalizeApiResponse(response.data);
};

export const updateAnswerOption = async (questionId, answerOptionId, payload) => {
  const response = await api.put(`/questions/${questionId}/answer-options/${answerOptionId}`, payload);
  return normalizeApiResponse(response.data);
};

export const deleteAnswerOption = async (questionId, answerOptionId) => {
  const response = await api.delete(
    `/questions/${questionId}/answer-options/${answerOptionId}`,
  );
  return { success: response.status === 204 };
};

export const reorderAnswerOptions = async (questionId, items) => {
  const response = await api.put(`/questions/${questionId}/answer-options/reorder`, { items });
  return normalizeApiResponse(response.data);
};

// ===== Bulk create (Quiz settings + Questions + Answers cùng lúc) =====
export const bulkCreateQuiz = async (materialId, payload) => {
  const response = await api.post(`/quiz-materials/${materialId}/bulk`, payload);
  return normalizeApiResponse(response.data);
};

// ===== Question Import =====

/**
 * Download file Excel template để import câu hỏi.
 * Trả về Blob để frontend tạo link download.
 */
export const downloadImportTemplate = async (quizMaterialId) => {
  const response = await api.get(
    `/quiz-materials/${quizMaterialId}/questions/import-template`,
    { responseType: "blob" },
  );
  return response;
};

/**
 * Preview import file — parse và validate, KHÔNG lưu DB.
 * @param {string} quizMaterialId
 * @param {File} file - file .xlsx
 */
export const previewImportQuestions = async (quizMaterialId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    `/quiz-materials/${quizMaterialId}/questions/import/preview`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return normalizeApiResponse(response.data);
};

/**
 * Confirm import — lưu tất cả dòng hợp lệ vào DB.
 * @param {string} quizMaterialId
 * @param {File} file - cùng file đã preview
 */
export const confirmImportQuestions = async (quizMaterialId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    `/quiz-materials/${quizMaterialId}/questions/import/confirm`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return normalizeApiResponse(response.data);
};
