import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  open = true,
  title,
  description,
  confirmLabel = "Xác nhận xóa",
  cancelLabel = "Hủy",
  tone = "danger",
  icon = "fa-trash-can",
  busy = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        style={{ position: "relative" }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Đóng"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 16,
            color: "#9ca3af",
            cursor: "pointer",
            padding: 4,
            lineHeight: 1,
          }}
        >
          <i className="fas fa-times" />
        </button>
        <div className={`${styles.iconBox} ${styles[tone]}`}>
          <i className={`fas ${icon}`} aria-hidden="true" />
        </div>

        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}

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
            className={`${styles.confirmBtn} ${styles[`${tone}Btn`]}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Đang xử lý...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
