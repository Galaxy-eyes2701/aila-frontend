import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination/Pagination";
import { resolveApiError } from "../../../utils/api";
import { formatPrice, formatDateTime } from "../../../utils/subscriptionPlan";
import { getPaymentHistory } from "./services/subscriptionApi";
import PaymentDetailModal from "./PaymentDetailModal";
import styles from "./PaymentHistory.module.css";

/* ── Helpers ── */
function statusConfig(status) {
  switch (status) {
    case "Success":   return { label: "Thành công",  cls: styles.badgeSuccess,   icon: "fa-circle-check"   };
    case "Pending":   return { label: "Đang chờ",    cls: styles.badgePending,   icon: "fa-clock"          };
    case "Expired":   return { label: "Hết hạn",     cls: styles.badgeExpired,   icon: "fa-circle-xmark"   };
    case "Cancelled": return { label: "Đã hủy",      cls: styles.badgeCancelled, icon: "fa-ban"            };
    default:          return { label: status,         cls: styles.badgeExpired,   icon: "fa-circle"         };
  }
}

function toInputDate(iso) {
  if (!iso) return "";
  return iso.slice(0, 10); // YYYY-MM-DD
}

/**
 * UC-20: Xem lịch sử thanh toán.
 * Route: /profile/payment-history
 * BR-01: Chỉ xem lịch sử của chính mình.
 * BR-02: Lọc theo date range.
 */
export default function PaymentHistory() {
  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  // Applied filters (chỉ áp dụng khi nhấn Tìm kiếm)
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo,   setAppliedTo]   = useState("");

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Detail modal
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPaymentHistory({
        fromDate: appliedFrom || undefined,
        toDate:   appliedTo   || undefined,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.errorMessage || "Không thể tải lịch sử thanh toán.");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [appliedFrom, appliedTo, page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setPage(1);
  };

  const handleClear = () => {
    setFromDate(""); setToDate("");
    setAppliedFrom(""); setAppliedTo("");
    setPage(1);
  };

  const items = data?.items ?? [];
  const hasFilter = appliedFrom || appliedTo;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Hồ sơ
          </Link>
          <h1 className={styles.pageTitle}>
            Lịch sử thanh toán
            {data ? ` (${data.totalCount})` : ""}
          </h1>
        </div>

        {/* Filter — BR-02 */}
        <form className={styles.filterCard} onSubmit={handleSearch}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="fromDate">Từ ngày</label>
            <input
              id="fromDate"
              type="date"
              className={styles.filterInput}
              value={fromDate}
              max={toDate || undefined}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="toDate">Đến ngày</label>
            <input
              id="toDate"
              type="date"
              className={styles.filterInput}
              value={toDate}
              min={fromDate || undefined}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.btnSearch}>
              <i className="fas fa-search" /> Tìm kiếm
            </button>
            {hasFilter && (
              <button type="button" className={styles.btnClear} onClick={handleClear}>
                <i className="fas fa-times" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
            <button className={styles.retryBtn} onClick={fetchData}>
              <i className="fas fa-rotate-right" /> Thử lại
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(c => (
                      <td key={c}>
                        <div className={styles.skeleton}
                          style={{ height: 18, borderRadius: 4, width: c === 1 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table — BR-03 (list view) */}
        {!loading && !error && (
          <>
            {items.length === 0 ? (
              /* AF-01 — Không có giao dịch phù hợp */
              <div className={styles.tableWrap}>
                <div className={styles.emptyState}>
                  <i className="fas fa-receipt" />
                  <p className={styles.emptyTitle}>
                    {hasFilter
                      ? "Không tìm thấy giao dịch nào trong khoảng thời gian này."
                      : "Bạn chưa có giao dịch thanh toán nào."}
                  </p>
                  <p className={styles.emptyDesc}>
                    {!hasFilter && "Mua gói đăng ký để bắt đầu sử dụng các tính năng AI."}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table} aria-label="Lịch sử thanh toán">
                  <thead>
                    <tr>
                      <th>Gói đăng ký</th>
                      <th>Số tiền</th>
                      <th>Ngày giao dịch</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const { label, cls, icon } = statusConfig(item.status);
                      return (
                        <tr
                          key={item.id}
                          className={styles.clickableRow}
                          onClick={() => setSelectedPaymentId(item.id)}
                          tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && setSelectedPaymentId(item.id)}
                          role="button"
                          aria-label={`Xem chi tiết giao dịch ${item.subscriptionPlanName}`}
                        >
                          <td>{item.subscriptionPlanName}</td>
                          <td><span className={styles.amount}>{formatPrice(item.amount)}</span></td>
                          <td>
                            <span className={styles.dateText}>
                              {item.paidAt
                                ? formatDateTime(item.paidAt)
                                : formatDateTime(item.createdAt)}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${cls}`}>
                              <i className={`fas ${icon}`} aria-hidden="true" />
                              {label}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.viewBtn}
                              onClick={e => { e.stopPropagation(); setSelectedPaymentId(item.id); }}
                              aria-label="Xem chi tiết"
                            >
                              <i className="fas fa-eye" /> Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                itemsPerPage={pageSize}
                totalItems={data.totalCount}
                onPageChange={p => setPage(p)}
                onItemsPerPageChange={ps => { setPageSize(ps); setPage(1); }}
                unitLabel="giao dịch"
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal — UC-20 Step 5-6 */}
      {selectedPaymentId && (
        <PaymentDetailModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
        />
      )}
    </div>
  );
}
