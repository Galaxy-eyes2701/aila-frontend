import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ReportManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import CoursePreviewModal from "../../../components/CoursePreviewModal/CoursePreviewModal";
import {
  getAdminReports,
  getReportDetail,
  resolveAdminReport,
  lockCourseFromReport,
  unlockCourse,
} from "../services/reportApi";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Pending" },
  { value: "Resolved", label: "Resolved" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "course", label: "Course report" },
  { value: "content", label: "Content report" },
];

const REASON_LABELS = {
  InappropriateContent: "Nội dung không phù hợp",
  HateSpeech:           "Ngôn ngữ thù địch",
  Violence:             "Bạo lực",
  SexualContent:        "Nội dung tình dục",
  Spam:                 "Spam / Quảng cáo",
  CopyrightViolation:   "Vi phạm bản quyền",
  IncorrectInformation: "Thông tin sai lệch",
  Other:                "Khác",
};

function getReasonLabel(reason) {
  return REASON_LABELS[reason] ?? reason ?? "—";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Resolved":
      return styles.statusResolved;
    case "Rejected":
      return styles.statusRejected;
    case "Reviewing":
      return styles.statusReviewing;
    default:
      return styles.statusPending;
  }
}

// BE trả contentType = "Course" hoặc "Learning Material" (ReportDto/ReportDetailDto),
// không có field "reportType".
function getTypeLabel(contentType) {
  return contentType === "Course" ? "Course report" : "Content report";
}

function ReportDetailModal({ report, onClose, onResolve, onLock, onUnlock, onPreview, resolving, locking }) {
  if (!report) return null;

  const isCourseReport = report.contentType === "Course";
  const isLocked       = !!report.isCourseLocked;
  const isResolved     = report.status === "Resolved";

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết báo cáo</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Loại nội dung</span>
            <div className={styles.metaValue}>{report.contentType || "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Trạng thái</span>
            <div className={styles.metaValue}>{report.status || "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Người báo cáo</span>
            <div className={styles.metaValue}>{report.learnerName || "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Email người báo cáo</span>
            <div className={styles.metaValue}>{report.learnerEmail || "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Ngày tạo</span>
            <div className={styles.metaValue}>{formatDate(report.createdAt)}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Ngày xử lý</span>
            <div className={styles.metaValue}>{formatDate(report.resolvedAt)}</div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Khóa học</span>
            <div className={styles.metaValue}>
              <span>{report.courseName || "—"}</span>
              {isCourseReport && isLocked && (
                <span className={styles.lockedBadge} style={{ marginLeft: 8 }}>
                  <i className="fas fa-lock" /> Đang bị khoá
                </span>
              )}
              {/* Nút xem trước course */}
              {report.courseId && (
                <button
                  type="button"
                  className={styles.previewCourseBtn}
                  onClick={() => onPreview(report.courseId)}
                  title="Xem trước khóa học"
                >
                  <i className="fas fa-eye" /> Xem trước
                </button>
              )}
            </div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Học liệu</span>
            <div className={styles.metaValue}>{report.materialName || "—"}</div>
          </div>
        </div>

        <div className={styles.metaItem} style={{ marginBottom: 14 }}>
          <span className={styles.metaLabel}>Lý do</span>
          <div className={styles.metaValue}>{getReasonLabel(report.reason)}</div>
        </div>

        <div className={styles.descriptionBox}>
          {report.description || "Không có mô tả chi tiết."}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Đóng
          </button>

          {/* Nút Lock — chỉ hiện với course report chưa bị lock và chưa resolved */}
          {isCourseReport && !isLocked && !isResolved && (
            <button
              className={styles.lockButton}
              onClick={() => onLock(report.id)}
              disabled={locking}
            >
              {locking ? (
                <><i className="fas fa-spinner fa-spin" /> Đang khoá...</>
              ) : (
                <><i className="fas fa-lock" /> Khoá khóa học & xử lý</>
              )}
            </button>
          )}

          {/* Nút Unlock — chỉ hiện khi course đang bị lock */}
          {isCourseReport && isLocked && report.courseId && (
            <button
              className={styles.unlockButton}
              onClick={() => onUnlock(report.courseId)}
              disabled={locking}
            >
              {locking ? (
                <><i className="fas fa-spinner fa-spin" /> Đang gỡ khoá...</>
              ) : (
                <><i className="fas fa-lock-open" /> Gỡ khoá khóa học</>
              )}
            </button>
          )}

          {/* Nút Resolve thông thường — chỉ hiện khi chưa resolved và không lock */}
          {!isResolved && !(isCourseReport && !isLocked) && (
            <button
              className={styles.resolveButton}
              onClick={() => onResolve(report.id)}
              disabled={resolving}
            >
              {resolving ? (
                <><i className="fas fa-spinner fa-spin" /> Đang xử lý...</>
              ) : (
                <><i className="fas fa-check" /> Đánh dấu đã xử lý</>
              )}
            </button>
          )}

          {isResolved && (
            <button className={styles.resolveButton} disabled>
              Đã xử lý
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState("");
  const [lockingId, setLockingId] = useState("");
  const [previewCourseId, setPreviewCourseId] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getAdminReports({
        status: statusFilter || undefined,
        isCourseReport: typeFilter === "" ? undefined : typeFilter === "course",
      });

      if (res.success) {
        setReports(res.data ?? []);
      } else {
        setPageError(res.errorMessage || "Không thể tải danh sách báo cáo.");
      }
    } catch (err) {
      setPageError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openDetail = async (report) => {
    setDetailLoading(true);
    setSelectedReport(report);

    try {
      const res = await getReportDetail(report.id);
      if (res.success) {
        setSelectedReport(res.data ?? report);
      } else {
        showToast(res.errorMessage || "Không thể tải chi tiết báo cáo.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async (reportId) => {
    if (!window.confirm("Bạn có chắc muốn đánh dấu báo cáo này là đã xử lý?")) return;

    setResolvingId(reportId);

    try {
      const res = await resolveAdminReport(reportId);

      if (res.success) {
        const nextStatus = res.data?.status || "Resolved";
        setReports((prev) => prev.map((item) => (item.id === reportId ? { ...item, status: nextStatus } : item)));
        setSelectedReport((prev) => (prev && prev.id === reportId ? { ...prev, status: nextStatus, resolvedAt: res.data?.resolvedAt } : prev));
        showToast(res.data?.message || "Đã đánh dấu báo cáo là đã xử lý.");
      } else {
        showToast(res.errorMessage || "Không thể cập nhật báo cáo.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setResolvingId("");
    }
  };

  const handleLock = async (reportId) => {
    if (!window.confirm("Khoá khóa học này và đánh dấu báo cáo đã xử lý?\nExpert sẽ không thể publish lại cho đến khi được gỡ khoá.")) return;

    setLockingId(reportId);

    try {
      const res = await lockCourseFromReport(reportId);

      if (res.success) {
        // Cập nhật list: report chuyển Resolved, course isCourseLocked = true
        setReports((prev) =>
          prev.map((item) =>
            item.id === reportId
              ? { ...item, status: "Resolved", isCourseLocked: true }
              : item
          )
        );
        setSelectedReport((prev) =>
          prev && prev.id === reportId
            ? { ...prev, status: "Resolved", isCourseLocked: true, resolvedAt: new Date().toISOString() }
            : prev
        );
        showToast(res.data?.message || "Đã khoá khóa học và xử lý báo cáo.");
      } else {
        showToast(res.errorMessage || "Không thể khoá khóa học.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setLockingId("");
    }
  };

  const handleUnlock = async (courseId) => {
    if (!window.confirm("Gỡ khoá khóa học này?\nExpert sẽ có thể publish lại khóa học.")) return;

    setLockingId(courseId);

    try {
      const res = await unlockCourse(courseId);

      if (res.success) {
        // Cập nhật list và detail: isCourseLocked = false
        setReports((prev) =>
          prev.map((item) =>
            item.courseId === courseId
              ? { ...item, isCourseLocked: false }
              : item
          )
        );
        setSelectedReport((prev) =>
          prev && prev.courseId === courseId
            ? { ...prev, isCourseLocked: false }
            : prev
        );
        showToast(res.data?.message || "Đã gỡ khoá khóa học.");
      } else {
        showToast(res.errorMessage || "Không thể gỡ khoá.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setLockingId("");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Review reported content</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Review reported content</h1>
            <p className={styles.headerText}>
              Xem danh sách báo cáo và đánh dấu các báo cáo đã được xử lý.
            </p>
          </div>
        </section>

        <div className={styles.filterBar}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button className={styles.secondaryButton} onClick={fetchReports} disabled={loading}>
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Loại</th>
                <th>Lý do</th>
                <th>Người báo cáo</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className={styles.loadingRow}>
                  <td colSpan={6}>Đang tải danh sách báo cáo...</td>
                </tr>
              )}

              {!loading && pageError && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button className={styles.secondaryButton} onClick={fetchReports}>
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && reports.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-inbox" />
                      <p>Không có báo cáo nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <span className={`${styles.badge} ${styles.typeBadge}`}>
                      {getTypeLabel(report.contentType)}
                    </span>
                    {report.contentType === "Course" && report.isCourseLocked && (
                      <span className={styles.lockedBadge} style={{ marginLeft: 6 }}>
                        <i className="fas fa-lock" /> Bị khoá
                      </span>
                    )}
                  </td>
                  <td>{getReasonLabel(report.reason)}</td>
                  <td>{report.learnerName || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${getStatusClass(report.status)}`}>
                      {report.status || "Pending"}
                    </span>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button className={styles.detailButton} onClick={() => openDetail(report)}>
                        <i className="fas fa-eye" /> Chi tiết
                      </button>

                      {/* Nút Xem trước course */}
                      {report.courseId && (
                        <button
                          className={styles.detailButton}
                          onClick={() => setPreviewCourseId(report.courseId)}
                          title="Xem trước khóa học bị báo cáo"
                        >
                          <i className="fas fa-search" /> Xem course
                        </button>
                      )}

                      {/* Nút Lock — course report chưa bị lock, chưa resolved */}
                      {report.contentType === "Course" && !report.isCourseLocked && report.status !== "Resolved" && (
                        <button
                          className={styles.lockButton}
                          onClick={() => handleLock(report.id)}
                          disabled={lockingId === report.id}
                          title="Khoá khóa học và xử lý báo cáo"
                        >
                          {lockingId === report.id
                            ? <i className="fas fa-spinner fa-spin" />
                            : <i className="fas fa-lock" />}
                        </button>
                      )}

                      {/* Nút Unlock — course đang bị lock */}
                      {report.contentType === "Course" && report.isCourseLocked && report.courseId && (
                        <button
                          className={styles.unlockButton}
                          onClick={() => handleUnlock(report.courseId)}
                          disabled={lockingId === report.courseId}
                          title="Gỡ khoá khóa học"
                        >
                          {lockingId === report.courseId
                            ? <i className="fas fa-spinner fa-spin" />
                            : <i className="fas fa-lock-open" />}
                        </button>
                      )}

                      {/* Nút Resolve thông thường — material report hoặc course report đã unlock */}
                      {report.status !== "Resolved" && !(report.contentType === "Course" && !report.isCourseLocked) && (
                        <button
                          className={styles.resolveButton}
                          onClick={() => handleResolve(report.id)}
                          disabled={resolvingId === report.id}
                        >
                          {resolvingId === report.id
                            ? <i className="fas fa-spinner fa-spin" />
                            : <i className="fas fa-check" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolve={handleResolve}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onPreview={(courseId) => setPreviewCourseId(courseId)}
          resolving={!!resolvingId}
          locking={!!lockingId}
        />
      )}

      {previewCourseId && (
        <CoursePreviewModal
          courseId={previewCourseId}
          onClose={() => setPreviewCourseId(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}