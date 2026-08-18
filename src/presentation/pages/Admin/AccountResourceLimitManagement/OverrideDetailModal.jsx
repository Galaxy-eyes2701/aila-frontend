import { useEffect, useState } from "react";
import { resolveApiError } from "@services/api";
import ConfirmModal from "@presentation/components/ConfirmModal/ConfirmModal";
import {
  getAccountResourceLimitOverride,
  deleteAccountResourceLimitOverride,
} from "@services/resourceLimitApi";
import styles from "./AccountResourceLimitManagement.module.css";

export default function OverrideDetailModal({
  account,
  onClose,
  onEdit,
  onSuccess,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
      const { errorMessage } = resolveApiError(error);
      setErrorMessage(
        errorMessage || "Có lỗi xảy ra khi tải dữ liệu",
      );
    } finally {
      setLoading(false);
    }
  }

  async function executeDelete() {
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

      setShowConfirmDelete(false);
      onSuccess();
    } catch (error) {
      const { errorMessage } = resolveApiError(error);
      setErrorMessage(
        errorMessage || "Có lỗi xảy ra khi xóa cấu hình",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, []);

  const initial = (account.fullName || account.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <div className={styles.modalHeaderIcon}>
              <i className="fas fa-sliders-h" />
            </div>
            <h2 className={styles.modalTitle}>Chi tiết cấu hình riêng</h2>
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

          {loading ? (
            <div className={styles.detailGrid} style={{ textAlign: "center", padding: "20px 0" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: "#2563eb" }} />
              <p style={{ marginTop: 8, color: "#64748b", fontSize: 14 }}>Đang tải chi tiết...</p>
            </div>
          ) : data ? (
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-microchip" /> Token AI
                </span>
                <span className={styles.detailValue}>
                  {Number(data.aiTokenLimit ?? 0).toLocaleString("vi-VN")}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-robot" /> Lượt thực hành AI
                </span>
                <span className={styles.detailValue}>
                  {Number(data.aiPracticeScenarioLimit ?? 0).toLocaleString("vi-VN")}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-user-tie" /> Yêu cầu đánh giá chuyên gia
                </span>
                <span className={styles.detailValue}>
                  {Number(data.expertEvaluationRequestLimit ?? 0).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            Đóng
          </button>

          {data?.hasOverride && (
            <>
              <button
                type="button"
                onClick={() => onEdit(data)}
                disabled={loading}
                className={styles.primaryButton}
              >
                <i className="fas fa-pen" /> Chỉnh sửa
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading}
                className={styles.deleteButton}
              >
                <i className="fas fa-trash-can" /> Xóa cấu hình
              </button>
            </>
          )}
        </div>
      </div>

      {showConfirmDelete && (
        <ConfirmModal
          open={showConfirmDelete}
          title="Xóa cấu hình riêng?"
          description="Bạn có chắc muốn xóa cấu hình riêng của tài khoản này? Hệ thống sẽ quay về áp dụng hạn mức mặc định."
          tone="danger"
          confirmLabel="Xóa cấu hình"
          busy={loading}
          onConfirm={executeDelete}
          onClose={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
}
