import api from "@services/api";

/**
 * Lỗi API có mang errorCode để UI xử lý theo bảng lỗi (spec mục 2.5).
 */
export class ApiError extends Error {
  constructor(errorCode, errorMessage, status) {
    super(errorMessage || errorCode || "Đã xảy ra lỗi");
    this.name = "ApiError";
    this.errorCode = errorCode || "UNKNOWN";
    this.errorMessage = errorMessage || "Đã xảy ra lỗi không xác định.";
    this.status = status;
  }
}

/**
 * Gọi API và unwrap ResponseDto envelope { success, data, errorCode, errorMessage }.
 * Ném ApiError khi success === false hoặc HTTP lỗi.
 */
async function request(promise) {
  let res;
  try {
    res = await promise;
  } catch (err) {
    const resp = err?.response;
    if (resp) {
      const body = resp.data || {};
      throw new ApiError(body.errorCode, body.errorMessage, resp.status);
    }
    throw new ApiError(
      "NETWORK_ERROR",
      "Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.",
      0
    );
  }

  const body = res.data;
  if (body && body.success) return body.data;
  throw new ApiError(body?.errorCode, body?.errorMessage, res.status);
}

const base = (courseId, materialId) =>
  `/courses/${courseId}/materials/${materialId}/quiz`;

/** POST .../quiz/start — bắt đầu / tiếp tục lượt làm (idempotent). */
export function startQuiz(courseId, materialId) {
  return request(api.post(`${base(courseId, materialId)}/start`));
}

/** POST .../quiz/{attemptId}/submit — nộp bài (idempotent). */
export function submitQuiz(courseId, materialId, attemptId, answers) {
  return request(
    api.post(`${base(courseId, materialId)}/${attemptId}/submit`, { answers })
  );
}

/** GET .../quiz/result — tóm tắt kết quả lần mới nhất. */
export function getQuizResult(courseId, materialId) {
  return request(api.get(`${base(courseId, materialId)}/result`));
}

/** GET .../quiz/result/detail — chi tiết review đúng/sai. */
export function getQuizResultDetail(courseId, materialId) {
  return request(api.get(`${base(courseId, materialId)}/result/detail`));
}
