/**
 * Hằng số dùng chung cho luồng "Chuyên gia đánh giá" (UC-29, UC-30, UC-63, UC-64).
 * Backend trả enum dưới dạng chuỗi PascalCase — giữ nguyên làm key.
 */

export const REQUEST_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const REQUEST_STATUS_LABEL = {
  Pending: "Chờ phân công",
  InProgress: "Đang chờ chấm",
  Completed: "Đã có kết quả",
  Cancelled: "Đã hủy",
};

/** Icon Font Awesome đi kèm badge trạng thái. */
export const REQUEST_STATUS_ICON = {
  Pending: "fa-hourglass-half",
  InProgress: "fa-pen-to-square",
  Completed: "fa-circle-check",
  Cancelled: "fa-ban",
};

export const DIFFICULTY_LABEL = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
};

/** Chip lọc trên hàng chờ của chuyên gia (UC-63). `value === null` nghĩa là bỏ hẳn param. */
export const STATUS_FILTERS = [
  { value: null, label: "Tất cả" },
  { value: REQUEST_STATUS.IN_PROGRESS, label: REQUEST_STATUS_LABEL.InProgress },
  { value: REQUEST_STATUS.COMPLETED, label: REQUEST_STATUS_LABEL.Completed },
  { value: REQUEST_STATUS.CANCELLED, label: REQUEST_STATUS_LABEL.Cancelled },
];

/**
 * Ràng buộc form chấm điểm — khớp validator phía backend (UC-64,
 * `ExpertEvaluationSettings` trong aila-backend).
 * Thang điểm 0–100 để trùng thang với điểm AI (`PracticeAttempt.FinalScore`),
 * nhờ vậy hai kết quả so sánh được trực tiếp.
 */
export const EVALUATION_LIMITS = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  SCORE_DECIMALS: 2,
  FEEDBACK_MAX: 2000,
  RECOMMENDATION_MAX: 1000,
};

/** Backend chặn pageSize tối đa 100 (gửi lớn hơn sẽ bị kẹp xuống). */
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Ánh xạ errorCode -> thông báo + mức độ hiển thị.
 * `type: "info"` dành cho tình huống "không ai làm sai" — không hiện như lỗi đỏ.
 */
export const ERROR_MESSAGES = {
  PRACTICE_ATTEMPT_NOT_FOUND: {
    type: "error",
    message: "Không tìm thấy lượt thực hành.",
  },
  AI_EVALUATION_UNAVAILABLE: {
    type: "info",
    message: "Bài thực hành chưa có kết quả chấm của AI.",
  },
  EVALUATION_ALREADY_REQUESTED: {
    type: "info",
    message: "Bạn đã gửi yêu cầu đánh giá cho lượt thực hành này.",
  },
  EXPERT_UNAVAILABLE: {
    type: "error",
    message: "Chuyên gia phụ trách khóa học hiện không khả dụng.",
  },
  EVALUATION_REQUEST_NOT_FOUND: {
    type: "error",
    message: "Không tìm thấy yêu cầu đánh giá.",
  },
  ALREADY_EVALUATED: {
    type: "info",
    message: "Yêu cầu này đã được chấm.",
  },
  INVALID_STATE: {
    type: "info",
    message: "Yêu cầu không còn ở trạng thái có thể chấm.",
  },
};

export const GENERIC_ERROR_MESSAGE =
  "Đã có lỗi xảy ra. Vui lòng thử lại sau ít phút.";

export const NETWORK_ERROR_MESSAGE =
  "Không kết nối được máy chủ. Vui lòng kiểm tra đường truyền và thử lại.";

/** Học liệu đã bị xóa -> backend trả materialTitle rỗng. */
export const DELETED_MATERIAL_TITLE = "Học liệu không còn tồn tại";

/**
 * Chuyển `{ errorCode }` từ `resolveApiError` thành toast `{ type, message }`.
 * Giữ nguyên `errorMessage` của server khi không khớp mã nào đã biết.
 */
export function toToast({ errorCode, errorMessage, status }) {
  const known = ERROR_MESSAGES[errorCode];
  if (known) return { ...known };
  if (status === 0) return { type: "error", message: NETWORK_ERROR_MESSAGE };
  return { type: "error", message: errorMessage || GENERIC_ERROR_MESSAGE };
}
