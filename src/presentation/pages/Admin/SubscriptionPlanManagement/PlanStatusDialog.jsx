import { useRef, useState } from 'react';
import useModalA11y from '@state/hooks/useModalA11y';
import { resolveApiError } from '@services/api';
import { formatDuration, formatPrice } from '@services/subscriptionPlan';
import { changeSubscriptionPlanStatus } from "@services/adminSubscriptionPlanApi";
import styles from './SubscriptionPlanManagement.module.css';

const STALE_STATUS_CODES = ['PLAN_ALREADY_ACTIVE', 'PLAN_ALREADY_INACTIVE'];

/**
 * Dialog xác nhận đổi trạng thái gói (UC-92).
 * Bấm Ngừng bán / Mở bán ở bảng KHÔNG gọi API ngay — phải đi qua dialog này.
 */
export default function PlanStatusDialog({ plan, onClose, onResolved }) {
  const activating = plan.status !== 'Active';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cancelRef = useRef(null);
  const containerRef = useModalA11y(() => {
    if (!submitting) onClose();
  }, cancelRef);

  const handleConfirm = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await changeSubscriptionPlanStatus(plan.id, activating);

      if (res.success) {
        onResolved({
          message: activating ? 'Đã mở bán gói.' : 'Đã ngừng bán gói.',
          type: 'success',
        });
        return;
      }

      if (STALE_STATUS_CODES.includes(res.errorCode)) {
        onResolved({
          message: 'Trạng thái gói vừa được thay đổi bởi người khác. Danh sách đã được làm mới.',
          type: 'info',
        });
        return;
      }

      if (res.errorCode === 'PLAN_NOT_FOUND') {
        onResolved({ message: 'Gói đăng ký không còn tồn tại.', type: 'error' });
        return;
      }

      setError(res.errorMessage || 'Không thể đổi trạng thái gói. Vui lòng thử lại.');
      setSubmitting(false);
    } catch (err) {
      const { status, errorCode, errorMessage } = resolveApiError(err);

      if (STALE_STATUS_CODES.includes(errorCode)) {
        // Không phải lỗi của người dùng — chỉ là UI đang giữ dữ liệu cũ.
        onResolved({
          message: 'Trạng thái gói vừa được thay đổi bởi người khác. Danh sách đã được làm mới.',
          type: 'info',
        });
        return;
      }

      if (status === 404) {
        onResolved({ message: 'Gói đăng ký không còn tồn tại.', type: 'error' });
        return;
      }

      setError(errorMessage || 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div
        className={`${styles.modal} ${styles.dialog}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="plan-status-title"
        aria-describedby="plan-status-desc"
        tabIndex={-1}
        ref={containerRef}
      >
        <div className={styles.modalHeader}>
          <h2 id="plan-status-title">
            {activating ? 'Mở bán lại gói' : 'Ngừng bán gói'} <strong>{plan.name}</strong>?
          </h2>
        </div>

        <p className={styles.dialogText} id="plan-status-desc">
          {activating ? (
            <>
              Gói sẽ trở lại trang công khai với <strong>cấu hình hiện tại</strong> (giá{' '}
              {formatPrice(plan.price)}, thời hạn {formatDuration(plan.durationInDays)}). Nếu cần
              đổi giá hoặc quyền lợi, hãy cập nhật gói trước.
            </>
          ) : (
            <>
              Gói sẽ không còn hiển thị trên trang gói đăng ký công khai. Các gói đăng ký đã bán{' '}
              <strong>không bị ảnh hưởng</strong> và vẫn hoạt động bình thường.
            </>
          )}
        </p>

        {error && (
          <div className={styles.formBanner} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={submitting}
            ref={cancelRef}
          >
            Huỷ
          </button>
          <button
            type="button"
            className={activating ? styles.primaryButton : styles.dangerSolidButton}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Đang xử lý...
              </>
            ) : (
              <>{activating ? 'Mở bán' : 'Ngừng bán'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
