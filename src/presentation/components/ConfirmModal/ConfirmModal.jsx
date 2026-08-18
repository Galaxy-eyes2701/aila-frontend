import { useRef } from "react";
import useModalA11y from "@state/hooks/useModalA11y";
import styles from "./ConfirmModal.module.css";

/**
 * Shared Confirm Modal Component for confirmation dialogs across Admin & Expert pages.
 * Supports tones: "danger" | "warning" | "primary"
 */
export default function ConfirmModal({
  open = true,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  tone = "danger",
  icon,
  busy = false,
  onConfirm,
  onClose,
  children,
}) {
  const confirmRef = useRef(null);
  const containerRef = useModalA11y(busy ? () => {} : onClose, confirmRef);

  if (!open) return null;

  const defaultIcon =
    icon ??
    (tone === "danger"
      ? "fa-trash-can"
      : tone === "warning"
      ? "fa-triangle-exclamation"
      : "fa-circle-question");

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={busy}
          aria-label="Đóng"
        >
          <i className="fas fa-times" />
        </button>

        <div className={`${styles.iconWrap} ${styles[tone]}`}>
          <i className={`fas ${defaultIcon}`} aria-hidden="true" />
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
            {busy && <i className="fas fa-spinner fa-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
