import { useEffect, useState } from "react";

import {
  getAccountResourceLimitOverride,
  deleteAccountResourceLimitOverride,
} from "../services/resourceLimitApi";
import styles from "./OverrideModal.module.css";

export default function OverrideDetailModal({
  account,

  onClose,

  onEdit,

  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [data, setData] = useState(null);

  async function loadDetail() {
    try {
      setLoading(true);

      setErrorMessage("");

      const response = await getAccountResourceLimitOverride(account.accountId);

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Không thể tải thông tin cấu hình",
        );

        return;
      }

      setData(response.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi tải dữ liệu",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa cấu hình riêng của tài khoản này?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      const response = await deleteAccountResourceLimitOverride(
        account.accountId,
      );

      if (!response.success) {
        setErrorMessage(response.errorMessage ?? "Xóa cấu hình thất bại");

        return;
      }

      onSuccess();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi xóa cấu hình",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Chi tiết cấu hình tài nguyên</h2>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        {loading && <div className={styles.loading}>Đang tải...</div>}

        {data && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>

              <div>{account.email}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Token AI</label>

              <div>{data.aiTokenLimit ?? 0}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Lượt thực hành AI</label>

              <div>{data.aiPracticeScenarioLimit ?? 0}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Yêu cầu đánh giá chuyên gia
              </label>

              <div>{data.expertEvaluationRequestLimit ?? 0}</div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            Đóng
          </button>

          {data?.hasOverride && (
            <>
              <button
                onClick={() => {
                  onEdit(data);
                }}
                disabled={loading}
                className={styles.primaryButton}
              >
                Sửa
              </button>

              <button
                onClick={handleDelete}
                disabled={loading}
                className={styles.deleteButton}
              >
                Xóa
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
