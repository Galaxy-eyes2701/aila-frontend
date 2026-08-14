import { useEffect, useRef, useState } from "react";
import { resolveApiError } from "@services/api";
import { formatPrice, formatDateTime, formatDuration } from "@services/subscriptionPlan";
import { getPaymentDetail } from "@services/subscriptionApi";
import styles from "./PaymentDetailModal.module.css";

/* ── Status config ── */
function statusConfig(status) {
  switch (status) {
    case "Success":   return { label: "Thành công", cls: styles.statusSuccess, icon: "fa-circle-check"  };
    case "Pending":   return { label: "Đang chờ",   cls: styles.statusPending, icon: "fa-clock"         };
    case "Expired":   return { label: "Hết hạn",    cls: styles.statusExpired, icon: "fa-circle-xmark"  };
    case "Cancelled": return { label: "Đã hủy",     cls: styles.statusCancel,  icon: "fa-ban"           };
    default:          return { label: status,        cls: styles.statusExpired, icon: "fa-circle"        };
  }
}

/**
 * UC-20 Step 5-6: Modal hiển thị chi tiết một giao dịch thanh toán.
 * BR-03: plan name, amount, status, payment date, transaction ref, payment content.
 */
export default function PaymentDetailModal({ paymentId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const overlayRef = useRef(null);
  const closeRef   = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getPaymentDetail(paymentId)
      .then(res => {
        if (cancelled) return;
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.errorMessage || "Không thể tải chi tiết giao dịch.");
        }
      })
      .catch(err => {
        if (cancelled) return;
        const { errorMessage } = resolveApiError(err);
        setError(errorMessage || "Lỗi kết nối. Vui lòng thử lại.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [paymentId]);

  // Close on Escape + focus trap
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detail = data;
  const { label: statusLabel, cls: statusCls, icon: statusIcon } =
    detail ? statusConfig(detail.status) : { label: "", cls: "", icon: "" };

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết giao dịch thanh toán"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <i className="fas fa-receipt" /> Chi tiết giao dịch
          </h2>
          <button
            ref={closeRef}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingState}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 28 }} />
              <p>Đang tải...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner} role="alert">
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Status badge */}
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${statusCls}`}>
                  <i className={`fas ${statusIcon}`} aria-hidden="true" />
                  {statusLabel}
                </span>
                <span className={styles.amountBig}>{formatPrice(detail.amount)}</span>
              </div>

              {/* Detail rows — BR-03 */}
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Gói đăng ký</dt>
                  <dd className={styles.detailValue}>{detail.subscriptionPlanName}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Cấp độ gói</dt>
                  <dd className={styles.detailValue}>Tier {detail.tierLevel}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Thời hạn</dt>
                  <dd className={styles.detailValue}>{formatDuration(detail.durationInDays)}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Ngày tạo giao dịch</dt>
                  <dd className={styles.detailValue}>{formatDateTime(detail.createdAt)}</dd>
                </div>
                {detail.paidAt && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Ngày thanh toán</dt>
                    <dd className={styles.detailValue}>{formatDateTime(detail.paidAt)}</dd>
                  </div>
                )}
                {detail.transactionCode && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Mã giao dịch ngân hàng</dt>
                    <dd className={`${styles.detailValue} ${styles.mono}`}>
                      {detail.transactionCode}
                    </dd>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Nội dung chuyển khoản</dt>
                  <dd className={`${styles.detailValue} ${styles.mono}`}>
                    {detail.paymentContent}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.closeFooterBtn} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
