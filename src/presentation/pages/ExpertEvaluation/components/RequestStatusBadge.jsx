import {
  REQUEST_STATUS_ICON,
  REQUEST_STATUS_LABEL,
} from "@infrastructure/constants/expertEvaluation";
import styles from "./RequestStatusBadge.module.css";

/**
 * Badge trạng thái yêu cầu đánh giá — dùng chung UC-30, UC-63, UC-64.
 * Màu: Pending = xám · InProgress = vàng/cam · Completed = xanh lá · Cancelled = đỏ nhạt.
 */
export default function RequestStatusBadge({ status, size = "md" }) {
  const label = REQUEST_STATUS_LABEL[status] ?? "Không xác định";
  const icon = REQUEST_STATUS_ICON[status] ?? "fa-circle-question";
  const tone = styles[status] ?? styles.Pending;

  return (
    <span
      className={`${styles.badge} ${tone} ${size === "sm" ? styles.sm : ""}`}
      aria-label={`Trạng thái yêu cầu: ${label}`}
    >
      <i className={`fas ${icon}`} aria-hidden="true" />
      {label}
    </span>
  );
}
