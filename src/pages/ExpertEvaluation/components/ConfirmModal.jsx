import { useRef } from "react";
import useModalA11y from "../../../hooks/useModalA11y";
import styles from "./ConfirmModal.module.css";

/**
 * Modal xác nhận dùng chung cho UC-29 (gửi yêu cầu) và UC-64 (nộp kết quả).
 * Focus trap / Esc / khóa scroll nền do `useModalA11y` lo.
 *
 * @param {"primary"|"warning"} tone  màu nút xác nhận
 */
export default function ConfirmModal({
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  tone = "primary",
  icon = "fa-circle-question",
  busy = false,
  onConfirm,
  onClose,
  children,
}) {
  const confirmRef = useRef(null);
  const containerRef = useModalA11y(busy ? () => {} : onClose, confirmRef);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={styles.modal}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
      >
        <div className={`${styles.icon} ${styles[tone]}`}>
          <i className={`fas ${icon}`} aria-hidden="true" />
        </div>

        <h3 className={styles.title} id="confirm-modal-title">
          {title}
        </h3>
        {description && <p className={styles.description}>{description}</p>}
        {children}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`${styles.confirmBtn} ${styles[`${tone}Btn`]}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <i className={`fas fa-spinner ${styles.spinner}`} aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
