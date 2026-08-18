import { useState } from "react";
import { resolveApiError } from "@services/api";
import styles from "./AccountResourceLimitManagement.module.css";
import { updateAccountResourceLimitOverride } from "@services/resourceLimitApi";

export default function EditOverrideModal({
  account,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    maxDailyTokens: account.dailyTokenLimit ?? 100000,
    maxDailyAttempts: account.dailyAttemptLimit ?? 50,
    maxDailySimulations: account.dailySimulationLimit ?? 20,
    reason: account.overrideReason ?? "",
  });

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "reason" ? value : Math.max(0, Number(value) || 0),
    }));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await updateAccountResourceLimitOverride(
        account.accountId,
        form,
      );

      if (!response.success) {
        setErrorMessage(response.errorMessage ?? "Cập nhật cấu hình thất bại");
        return;
      }

      onSuccess();
    } catch (error) {
      const { errorMessage } = resolveApiError(error);
      setErrorMessage(
        errorMessage || "Có lỗi xảy ra khi cập nhật cấu hình",
      );
    } finally {
      setLoading(false);
    }
  }

  const initial = (account.fullName || account.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <div className={styles.modalHeaderIcon}>
              <i className="fas fa-pen-to-square" />
            </div>
            <h2 className={styles.modalTitle}>Cập nhật cấu hình riêng</h2>
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
              />
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
              />
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
              />
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
                  <i className="fas fa-save" /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
