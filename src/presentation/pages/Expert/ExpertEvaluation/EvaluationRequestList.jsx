import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "@presentation/components/Pagination/Pagination";
import RequestStatusBadge from "../../ExpertEvaluation/components/RequestStatusBadge";
import {
  DEFAULT_PAGE_SIZE,
  REQUEST_STATUS,
  STATUS_FILTERS,
} from "@infrastructure/constants/expertEvaluation";
import { resolveApiError } from "@services/api";
import { getAssignedRequests } from "@services/expertEvaluationApi";
import {
  formatDateTime,
  formatRelativeTime,
  resolveMaterialTitle,
} from "@services/expertEvaluationFormat";
import styles from "./EvaluationRequestList.module.css";

/** UC-63 — hàng chờ các yêu cầu đánh giá được giao cho chuyên gia. */
export default function EvaluationRequestList() {
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 1-based cho <Pagination />
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Pagination 1-based -> backend 0-based.
      const result = await getAssignedRequests({
        status,
        pageIndex: currentPage - 1,
        pageSize,
      });
      setData(result);
    } catch (err) {
      const { status: httpStatus, errorMessage } = resolveApiError(err);
      if (httpStatus === 401) {
        navigate("/expert/login");
        return;
      }
      setError(errorMessage || "Không tải được danh sách yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [status, currentPage, pageSize, navigate]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const changeStatus = (value) => {
    setStatus(value);
    setCurrentPage(1); // Đổi bộ lọc luôn reset về trang 1.
  };

  const items = data?.items ?? [];
  const isFiltered = status !== null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/expert">Trang chủ Chuyên gia</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span>Yêu cầu đánh giá</span>
          </nav>

          <div className={styles.headerMain}>
            <div>
              <h1 className={styles.pageTitle}>Yêu cầu đánh giá</h1>
              <p className={styles.pageSubtitle}>
                Các lượt thực hành học viên nhờ bạn chấm trực tiếp.
              </p>
            </div>
            {data && (
              <span className={styles.totalPill}>
                <i className="fas fa-inbox" aria-hidden="true" />
                {data.totalItems} yêu cầu
              </span>
            )}
          </div>
        </header>

        {/* ── Bộ lọc trạng thái ── */}
        <div className={styles.filterBar} role="group" aria-label="Lọc theo trạng thái">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`${styles.chip} ${status === filter.value ? styles.chipActive : ""}`}
              aria-pressed={status === filter.value}
              onClick={() => changeStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* ── Nội dung ── */}
        {loading ? (
          <SkeletonTable />
        ) : error ? (
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <div>
              <strong>Không tải được dữ liệu</strong>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchRequests}>
              <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-inbox" aria-hidden="true" />
            {isFiltered ? (
              <>
                <p>Không có yêu cầu nào ở trạng thái này.</p>
                <button
                  type="button"
                  className={styles.clearFilterBtn}
                  onClick={() => changeStatus(null)}
                >
                  <i className="fas fa-filter-circle-xmark" aria-hidden="true" /> Bỏ lọc
                </button>
              </>
            ) : (
              <p>Bạn chưa được giao yêu cầu đánh giá nào.</p>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableCard}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Học viên</th>
                      <th scope="col">Bài thực hành</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Gửi lúc</th>
                      <th scope="col" className={styles.actionCol}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isPending = item.status === REQUEST_STATUS.IN_PROGRESS;
                      const detailPath = `/expert/evaluation-requests/${item.requestId}`;

                      return (
                        <tr
                          key={item.requestId}
                          className={`${styles.row} ${isPending ? styles.rowHighlight : ""}`}
                          onClick={() => navigate(detailPath)}
                        >
                          <td className={styles.learnerCell}>
                            <span className={styles.avatarInitial} aria-hidden="true">
                              {(item.learnerName ?? "?").charAt(0).toUpperCase()}
                            </span>
                            {item.learnerName}
                          </td>
                          <td className={styles.materialCell}>
                            {resolveMaterialTitle(item.materialTitle)}
                          </td>
                          <td>
                            <RequestStatusBadge status={item.status} size="sm" />
                          </td>
                          <td
                            className={styles.timeCell}
                            title={formatDateTime(item.requestedAt)}
                          >
                            {formatRelativeTime(item.requestedAt)}
                          </td>
                          <td className={styles.actionCol}>
                            <Link
                              to={detailPath}
                              className={`${styles.actionBtn} ${
                                isPending ? styles.actionPrimary : styles.actionSecondary
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <i
                                className={`fas ${isPending ? "fa-pen-to-square" : "fa-eye"}`}
                                aria-hidden="true"
                              />
                              {isPending ? "Chấm bài" : "Xem"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              itemsPerPage={data.pageSize}
              totalItems={data.totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
              unitLabel="yêu cầu"
            />
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className={styles.tableCard}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}
