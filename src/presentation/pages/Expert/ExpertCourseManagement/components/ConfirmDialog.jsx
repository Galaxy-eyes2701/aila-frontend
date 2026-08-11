import styles from '../ExpertCourseManagement.module.css';

export default function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.dialog}>
        <div className={styles.dialogIcon}>
          <i className={`fas ${danger ? 'fa-exclamation-triangle' : 'fa-question-circle'}`} />
        </div>
        <h3 className={styles.dialogTitle}>{title}</h3>
        <p className={styles.dialogMsg}>{message}</p>
        <div className={styles.dialogActions}>
          <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
          <button
            className={danger ? styles.btnDanger : styles.btnConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
