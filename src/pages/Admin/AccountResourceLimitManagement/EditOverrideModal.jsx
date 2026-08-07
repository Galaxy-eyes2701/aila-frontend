import { useState } from "react";

import { updateAccountResourceLimitOverride } from "../services/resourceLimitApi";
import styles from "./OverrideModal.module.css";

export default function EditOverrideModal({
  account,

  data,

  onClose,

  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    aiTokenLimit: data.aiTokenLimit ?? 0,

    aiPracticeScenarioLimit: data.aiPracticeScenarioLimit ?? 0,

    expertEvaluationRequestLimit: data.expertEvaluationRequestLimit ?? 0,
  });

  function handleChange(field, value) {
    setForm({
      ...form,

      [field]: Number(value),
    });
  }

  async function handleSubmit() {
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
      setErrorMessage(
        error.response?.data?.errorMessage ??
          "Có lỗi xảy ra khi cập nhật cấu hình",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Cập nhật cấu hình tài nguyên</h2>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        <div className={styles.formGroup}>
          <label className={styles.label}>Email tài khoản</label>

          <input
            value={account.email}
            disabled
            className={`${styles.input} ${styles.disabledInput}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Token AI</label>

          <input
            type="number"
            value={form.aiTokenLimit}
            onChange={(e) => handleChange("aiTokenLimit", e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Lượt thực hành AI</label>

          <input
            type="number"
            value={form.aiPracticeScenarioLimit}
            onChange={(e) =>
              handleChange("aiPracticeScenarioLimit", e.target.value)
            }
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Yêu cầu đánh giá chuyên gia</label>

          <input
            type="number"
            value={form.expertEvaluationRequestLimit}
            onChange={(e) =>
              handleChange("expertEvaluationRequestLimit", e.target.value)
            }
            className={styles.input}
          />
        </div>

        <div className={styles.actions}>
          <button
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.primaryButton}
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
