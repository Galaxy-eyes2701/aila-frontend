import styles from "../Quiz.module.css";

/**
 * Xác nhận nộp bài. Cảnh báo nếu còn câu chưa trả lời.
 */
export default function ConfirmSubmitModal({
  answeredCount,
  totalQuestions,
  submitting,
  errorMessage,
  onConfirm,
  onCancel,
}) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Nộp bài kiểm tra?</h3>
        <p className={styles.modalText}>
          Bạn đã trả lời <strong>{answeredCount}</strong>/{totalQuestions} câu
          hỏi.
        </p>
        {unanswered > 0 && (
          <p className={`${styles.modalText} ${styles.modalWarn}`}>
            <i className="fas fa-triangle-exclamation" /> Còn {unanswered} câu
            chưa trả lời. Sau khi nộp bạn không thể sửa lại.
          </p>
        )}

        {errorMessage && (
          <div className={styles.alertError} role="alert">
            <i className="fas fa-plug-circle-xmark" />
            <span className={styles.alertErrorText}>{errorMessage}</span>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onCancel}
            disabled={submitting}
          >
            Tiếp tục làm
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Đang nộp...
              </>
            ) : errorMessage ? (
              <>
                <i className="fas fa-rotate-right" /> Thử lại
              </>
            ) : (
              "Nộp bài"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
