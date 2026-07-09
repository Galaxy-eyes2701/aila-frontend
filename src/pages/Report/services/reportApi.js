import api from "../../../utils/api";

/** Lỗi API mang errorCode để UI rẽ nhánh theo bảng lỗi (spec mục 2). */
export class ApiError extends Error {
  constructor(errorCode, errorMessage, status) {
    super(errorMessage || errorCode || "Đã xảy ra lỗi");
    this.name = "ApiError";
    this.errorCode = errorCode || "UNKNOWN";
    this.errorMessage = errorMessage || "Đã xảy ra lỗi không xác định.";
    this.status = status;
  }
}

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
      "Lỗi kết nối máy chủ. Vui lòng thử lại.",
      0
    );
  }

  const body = res.data;
  if (body && body.success) return body.data;
  throw new ApiError(body?.errorCode, body?.errorMessage, res.status);
}

/** GET /api/courses/{courseId}/reports/reasons — danh sách lý do (value + name). */
export function getReportReasons(courseId) {
  return request(api.get(`/courses/${courseId}/reports/reasons`));
}

/** POST /api/courses/{courseId}/reports — gửi báo cáo. body: { reason: number, description?: string }. */
export function reportCourse(courseId, body) {
  return request(api.post(`/courses/${courseId}/reports`, body));
}
