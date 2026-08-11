import api, { normalizeApiResponse } from "./api";
import { GENERIC_ERROR_MESSAGE } from "@infrastructure/constants/expertEvaluation";

/**
 * API layer cho luồng "Chuyên gia đánh giá".
 * Mỗi hàm trả thẳng `data` khi thành công và `throw` khi thất bại,
 * để component bắt bằng `resolveApiError(err)`.
 */

/**
 * Dựng Error mang envelope giả để `resolveApiError` bóc được errorCode
 * trong trường hợp hiếm: HTTP 2xx nhưng `success === false`.
 */
function envelopeError(status, envelope) {
  const err = new Error(envelope.errorMessage || GENERIC_ERROR_MESSAGE);
  err.response = { status, data: envelope };
  return err;
}

async function unwrap(request) {
  const res = await request;
  const envelope = normalizeApiResponse(res.data);
  if (!envelope.success) throw envelopeError(res.status, envelope);
  return envelope.data;
}

/** UC-29 · POST — gửi yêu cầu nhờ chuyên gia đánh giá một lượt thực hành. */
export function requestExpertEvaluation(attemptId) {
  return unwrap(
    api.post(`/learner/practice-attempts/${attemptId}/expert-evaluation-request`),
  );
}

/** UC-30 · GET — learner xem chi tiết yêu cầu + kết quả đánh giá của mình. */
export function getLearnerEvaluation(requestId) {
  return unwrap(api.get(`/learner/expert-evaluation-requests/${requestId}`));
}

/**
 * UC-63 · GET — hàng chờ của chuyên gia (PageResult).
 * `pageIndex` là 0-based. Bỏ hẳn param `status` khi người dùng chọn "Tất cả".
 */
export function getAssignedRequests({ status, pageIndex, pageSize }) {
  const params = { pageIndex, pageSize };
  if (status) params.status = status;
  return unwrap(api.get("/expert/expert-evaluation-requests", { params }));
}

/** UC-63 · GET — chi tiết một yêu cầu được giao cho chuyên gia. */
export function getAssignedRequestDetail(requestId) {
  return unwrap(api.get(`/expert/expert-evaluation-requests/${requestId}`));
}

/** UC-64 · POST — chuyên gia nộp kết quả đánh giá. */
export function provideEvaluation(
  requestId,
  { overallScore, feedback, recommendation },
) {
  const trimmedRecommendation = recommendation?.trim();
  return unwrap(
    api.post(`/expert/expert-evaluation-requests/${requestId}/evaluation`, {
      overallScore,
      feedback: feedback?.trim(),
      // Chuỗi rỗng -> null: backend hiểu là "chuyên gia không đưa khuyến nghị".
      recommendation: trimmedRecommendation ? trimmedRecommendation : null,
    }),
  );
}
