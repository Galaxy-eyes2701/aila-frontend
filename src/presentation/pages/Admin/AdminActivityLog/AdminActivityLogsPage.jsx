import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActivityLogFilter from "./ActivityLogFilter";
import ActivityLogTable from "./ActivityLogTable";
import Pagination from "@presentation/components/Pagination/Pagination";
import { getAdminActivityLogs } from "@services/adminActivityLogApi";
import styles from "./AdminActivityLogs.module.css";

function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "",
  });

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, currentPage, itemsPerPage]);

  const fetchLogs = async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAdminActivityLogs(currentFilters);

      if (!response.success) {
        setLogs([]);
        setError(response.errorMessage || "Không thể tải nhật ký hoạt động.");
        return;
      }

      setLogs(response.data ?? []);
    } catch (err) {
      const errorResponse = err?.response?.data;
      setLogs([]);
      setError(errorResponse?.errorMessage || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filters);
  }, []);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchLogs(newFilters);
  };

  const handleRetry = () => {
    fetchLogs(filters);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Nhật ký hoạt động</span>
        </div>

        {/* Header */}
        <section className={styles.headerBand}>
          <div>
            <h1>Nhật ký hoạt động quản trị viên</h1>
            <p className={styles.headerText}>
              Xem lại các hoạt động được thực hiện bởi quản trị viên trên nền tảng.
            </p>
          </div>

          <div className={styles.summaryBadge}>
            <span className={styles.summaryLabel}>Tổng số hoạt động</span>
            <span className={styles.summaryValue}>{logs.length}</span>
          </div>
        </section>

        {/* Filter */}
        <ActivityLogFilter onSearch={handleSearch} loading={loading} />

        {/* Error */}
        {error && (
          <div className={styles.errorBanner}>
            <div className={styles.errorIcon}>
              <i className="fas fa-exclamation-triangle" />
            </div>

            <div className={styles.errorContent}>
              <strong>Không thể tải nhật ký hoạt động</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className={styles.retryButton}
              onClick={handleRetry}
              disabled={loading}
            >
              <i className="fas fa-rotate-right" /> Thử lại
            </button>
          </div>
        )}

        {/* Activity Logs Table Container */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeaderBand}>
            <div>
              <h2>Lịch sử hoạt động</h2>
              <p className={styles.tableSubtitle}>Các hoạt động mới nhất được hiển thị trước.</p>
            </div>

            {!loading && !error && (
              <span className={styles.resultBadge}>
                {logs.length} hoạt động
              </span>
            )}
          </div>

          <ActivityLogTable logs={paginatedLogs} loading={loading} />

          {!loading && !error && logs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(logs.length / itemsPerPage))}
              itemsPerPage={itemsPerPage}
              totalItems={logs.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              unitLabel="hoạt động"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminActivityLogsPage;
