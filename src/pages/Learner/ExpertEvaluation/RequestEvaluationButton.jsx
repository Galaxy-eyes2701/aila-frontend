import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmModal from "../../../components/ExpertEvaluation/ConfirmModal";
import Toast from "../../../components/Toast/Toast";
import useModalA11y from "../../../hooks/useModalA11y";
import { resolveApiError } from "../../../utils/api";
import { requestExpertEvaluation } from "../../../utils/expertEvaluationApi";
import { toToast } from "../../../constants/expertEvaluation";
import styles from "./RequestEvaluationButton.module.css";

/**
 * UC-29 — nút "Nhờ chuyên gia đánh giá", nhúng vào màn hình kết quả lượt thực hành.
 *
 * @param {string}  attemptId        id lượt thực hành
 * @param {string}  attemptStatus    "InProgress" | "Completed" | "Abandoned"
 * @param {boolean} hasAiEvaluation  đã có điểm AI hay chưa
 * @param {string=} requestId        id yêu cầu đã gửi trước đó (nếu có)
 * @param {Function=} onRequested    callback nhận `data` khi gửi thành công
 * @param {Function=} onToast        parent tự quản lý toast; bỏ trống thì component tự render
 */
export default function RequestEvaluationButton({
  attemptId,
  attemptStatus,
  hasAiEvaluation,
  requestId: initialRequestId = null,
  onRequested,
  onToast,
}) {
  const navigate = useNavigate();

  const [requestId, setRequestId] = useState(initialRequestId);
  const [alreadyRequested, setAlreadyRequested] = useState(
    Boolean(initialRequestId),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  const showToast = (toast) => {
    if (onToast) onToast(toast);
    else setLocalToast(toast);
  };

  const isEligible = attemptStatus === "Completed" && hasAiEvaluation;

  const handleConfirm = async () => {
    // Cờ isSubmitting chặn double-click / double-submit.
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const data = await requestExpertEvaluation(attemptId);
      setRequestId(data.requestId);
      setAlreadyRequested(true);
      setConfirmOpen(false);
      showToast({
        type: "success",
        message: `Đã gửi yêu cầu. Bạn còn ${data.remainingQuota} lượt.`,
      });
      onRequested?.(data);
      navigate(`/learner/expert-evaluations/${data.requestId}`);
    } catch (err) {
      const apiError = resolveApiError(err);

      if (apiError.errorCode === "QUOTA_EXHAUSTED") {
        // Hết lượt không phải lỗi thao tác — mở modal nâng cấp gói thay vì toast đỏ.
        setConfirmOpen(false);
        setQuotaMessage(
          apiError.errorMessage ||
            "Bạn đã dùng hết lượt nhờ chuyên gia đánh giá trong gói hiện tại.",
        );
        return;
      }

      if (apiError.errorCode === "EVALUATION_ALREADY_REQUESTED") {
        setConfirmOpen(false);
        // Backend không trả requestId ở nhánh lỗi này -> chỉ chuyển nút sang
        // trạng thái "đã gửi yêu cầu"; learner mở chi tiết từ lịch sử.
        setAlreadyRequested(true);
      }

      showToast(toToast(apiError));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Đã gửi yêu cầu -> đổi thành link xem kết quả ─────────────
  if (alreadyRequested) {
    return (
      <>
        {requestId ? (
          <Link
            to={`/learner/expert-evaluations/${requestId}`}
            className={`${styles.button} ${styles.secondary}`}
          >
            <i className="fas fa-file-circle-check" aria-hidden="true" />
            Xem yêu cầu đã gửi
          </Link>
        ) : (
          <span className={`${styles.button} ${styles.sent}`}>
            <i className="fas fa-circle-check" aria-hidden="true" />
            Đã gửi yêu cầu
          </span>
        )}
        {localToast && (
          <Toast toast={localToast} onClose={() => setLocalToast(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          disabled={!isEligible || isSubmitting}
          onClick={() => setConfirmOpen(true)}
          title={
            isEligible
              ? undefined
              : "Hoàn thành bài thực hành để dùng chức năng này"
          }
        >
          {isSubmitting ? (
            <i className={`fas fa-spinner ${styles.spinner}`} aria-hidden="true" />
          ) : (
            <i className="fas fa-user-tie" aria-hidden="true" />
          )}
          Nhờ chuyên gia đánh giá
        </button>

        {!isEligible && (
          <p className={styles.hint}>
            <i className="fas fa-circle-info" aria-hidden="true" />
            Hoàn thành bài thực hành để dùng chức năng này
          </p>
        )}
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Nhờ chuyên gia đánh giá?"
          description="Yêu cầu sẽ được gửi tới chuyên gia phụ trách khóa học. Thao tác này tiêu 1 lượt trong gói của bạn và không thể hoàn tác."
          confirmLabel="Gửi yêu cầu"
          cancelLabel="Hủy"
          icon="fa-user-tie"
          busy={isSubmitting}
          onConfirm={handleConfirm}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {quotaMessage && (
        <QuotaExhaustedModal
          message={quotaMessage}
          onClose={() => setQuotaMessage(null)}
        />
      )}

      {localToast && (
        <Toast toast={localToast} onClose={() => setLocalToast(null)} />
      )}
    </>
  );
}

/** Modal "hết lượt" — dẫn learner sang trang gói đăng ký. */
function QuotaExhaustedModal({ message, onClose }) {
  const linkRef = useRef(null);
  const containerRef = useModalA11y(onClose, linkRef);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.quotaModal}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quota-modal-title"
        tabIndex={-1}
      >
        <div className={styles.quotaIcon}>
          <i className="fas fa-gem" aria-hidden="true" />
        </div>
        <h3 className={styles.quotaTitle} id="quota-modal-title">
          Bạn đã dùng hết lượt
        </h3>
        <p className={styles.quotaMessage}>{message}</p>

        <div className={styles.quotaActions}>
          <button type="button" className={styles.quotaCancel} onClick={onClose}>
            Đóng
          </button>
          <Link
            to="/subscription-plans"
            ref={linkRef}
            className={styles.quotaCta}
            onClick={onClose}
          >
            <i className="fas fa-arrow-up-right-dots" aria-hidden="true" />
            Xem các gói
          </Link>
        </div>
      </div>
    </div>
  );
}
