import { useEffect, useState } from "react";
import ActivityLogFilter from "./ActivityLogFilter";
import ActivityLogTable from "./ActivityLogTable";
import { getAdminActivityLogs } from "../services/adminActivityLogApi";
import styles from "./AdminActivityLogs.module.css";

function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "",
  });

  const fetchLogs = async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAdminActivityLogs(currentFilters);

      // HTTP 2xx nhưng nghiệp vụ thất bại
      if (!response.success) {
        setLogs([]);

        setError(response.errorMessage || "Không thể tải nhật ký hoạt động.");

        return;
      }

      setLogs(response.data ?? []);
    } catch (error) {
      /*
       * HTTP 4xx / 5xx
       *
       * Backend trả về:
       * {
       *   success: false,
       *   data: null,
       *   errorCode: "...",
       *   errorMessage: "..."
       * }
       */

      const errorResponse = error?.response?.data;

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
    fetchLogs(newFilters);
  };

  const handleRetry = () => {
    fetchLogs(filters);
  };

  return (
    <div className={styles.activityLogPage}>
      <div className={styles.activityLogContainer}>
        {/* Header */}
        <div className={styles.activityLogHeader}>
          <div>
            <div className={styles.pageBreadcrumb}>
              <span>Quản trị nền tảng</span>

              <span>/</span>

              <span>Nhật ký hoạt động</span>
            </div>

            <h1>Nhật ký hoạt động quản trị viên</h1>

            <p>
              Xem lại các hoạt động được thực hiện bởi quản trị viên trên nền
              tảng.
            </p>
          </div>

          <div className={styles.activityLogSummary}>
            <span className={styles.summaryLabel}>Tổng số hoạt động</span>

            <span className={styles.summaryValue}>{logs.length}</span>
          </div>
        </div>

        {/* Filter */}
        <ActivityLogFilter onSearch={handleSearch} loading={loading} />

        {/* Error */}
        {error && (
          <div className={styles.activityLogError}>
            <div className={styles.errorIcon}>!</div>

            <div>
              <strong>Không thể tải nhật ký hoạt động</strong>

              <p>{error}</p>
            </div>

            <button type="button" onClick={handleRetry} disabled={loading}>
              Thử lại
            </button>
          </div>
        )}

        {/* Activity Logs */}
        <div className={styles.activityLogCard}>
          <div className={styles.activityLogCardHeader}>
            <div>
              <h2>Lịch sử hoạt động</h2>

              <p>Các hoạt động mới nhất được hiển thị trước.</p>
            </div>

            {!loading && !error && (
              <span className={styles.resultCount}>
                {logs.length} {logs.length === 1 ? "hoạt động" : "hoạt động"}
              </span>
            )}
          </div>

          <ActivityLogTable logs={logs} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default AdminActivityLogsPage;
