import styles from "../ModuleManagement.module.css";
export default function ModuleModal({
  mode,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className={styles.modal} onSubmit={onSubmit}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>
              {mode === "create" ? "Chương mới" : "Cập nhật chương"}
            </p>
            <h2>
              {mode === "create" ? "Tạo chương học" : "Chỉnh sửa chương học"}
            </h2>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Đóng"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.formGroup}>
            <span>Tiêu đề *</span>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              maxLength={180}
              placeholder="Nhập tên chương học"
              autoFocus
            />
          </label>

          <label className={styles.formGroup}>
            <span>Mô tả</span>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={5}
              placeholder="Tóm tắt nội dung chương, mục tiêu học tập..."
            />
          </label>

          {error && (
            <div className={styles.formError}>
              <i className="fas fa-circle-exclamation" />
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className={styles.spinner} />
                Đang lưu
              </>
            ) : (
              <>
                <i className="fas fa-save" />
                Lưu chương
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
