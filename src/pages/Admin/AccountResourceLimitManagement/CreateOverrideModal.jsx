import { useState } from "react";
import { createAccountResourceLimitOverride } from "../services/resourceLimitApi";
import styles from "./OverrideModal.module.css";

export default function CreateOverrideModal({ account, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    accountId: account.accountId,
    aiTokenLimit: 0,
    aiPracticeScenarioLimit: 0,
    expertEvaluationRequestLimit: 0,
  });

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: Math.max(0, Number(value) || 0),
    }));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await createAccountResourceLimitOverride(form);

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Không thể tạo cấu hình giới hạn tài nguyên",
        );
        return;
      }

      onSuccess();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi tạo cấu hình",
      );
    } finally {
      setLoading(false);
    }
  }

  const initial = (account.fullName || account.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <div className={styles.modalHeaderIcon}>
              <i className="fas fa-sliders-h" />
            </div>
            <h2 className={styles.modalTitle}>Tạo cấu hình riêng</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Đóng"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMessage && (
              <div className={styles.errorAlert}>
                <i className="fas fa-exclamation-circle" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className={styles.userBanner}>
              <div className={styles.userAvatar}>{initial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {account.fullName || "Chưa cập nhật tên"}
                </span>
                <span className={styles.userEmail}>{account.email}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-microchip" /> Token AI (Hàng tháng)
              </label>
              <input
                type="number"
                min="0"
                value={form.aiTokenLimit}
                onChange={(e) => handleChange("aiTokenLimit", e.target.value)}
                className={styles.input}
                placeholder="Ví dụ: 100000"
              />
              <div className={styles.fieldHint}>
                Số lượng token AI tối đa được phép sử dụng trong 1 tháng.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-robot" /> Lượt thực hành AI (Hàng tháng)
              </label>
              <input
                type="number"
                min="0"
                value={form.aiPracticeScenarioLimit}
                onChange={(e) =>
                  handleChange("aiPracticeScenarioLimit", e.target.value)
                }
                className={styles.input}
                placeholder="Ví dụ: 50"
              />
              <div className={styles.fieldHint}>
                Số kịch bản thực hành AI được phép tham gia mỗi tháng.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-user-tie" /> Yêu cầu đánh giá chuyên gia
              </label>
              <input
                type="number"
                min="0"
                value={form.expertEvaluationRequestLimit}
                onChange={(e) =>
                  handleChange("expertEvaluationRequestLimit", e.target.value)
                }
                className={styles.input}
                placeholder="Ví dụ: 5"
              />
              <div className={styles.fieldHint}>
                Số lượt gửi yêu cầu nhận xét bài làm từ chuyên gia.
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.primaryButton}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <i className="fas fa-plus" /> Tạo cấu hình
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
