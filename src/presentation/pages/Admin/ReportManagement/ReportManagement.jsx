import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ReportManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import CoursePreviewModal from "@presentation/components/CoursePreviewModal/CoursePreviewModal";
import {
  getAdminReports,
  getReportDetail,
  resolveAdminReport,
  lockCourseFromReport,
  unlockCourse,
  dismissAdminReport,
} from "@services/adminReportApi";
import {
  getAdminReReviewRequests,
  approveReReviewRequest,
  rejectReReviewRequest,
  getCourseReports,
} from "@services/courseReviewApi";

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

/* ── Re-Review Request Status helpers ─────────────────────── */
const RR_STATUS_LABELS = { Pending: "Đang chờ", Approved: "Đã duyệt", Rejected: "Từ chối" };
const RR_STATUS_CLASS  = { Pending: styles.statusPending, Approved: styles.statusResolved, Rejected: styles.statusRejected };

/* ── DismissModal — admin từ chối báo cáo kèm ghi chú ────── */
function DismissModal({ report, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 460 }}>
        <div className={styles.modalHeader}>
          <h2><i className="fas fa-times-circle" style={{ color: "#dc2626", marginRight: 8 }} />Từ chối báo cáo</h2>
          <button className={styles.closeButton} onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div style={{ padding: "4px 0 16px" }}>
          <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>
            Từ chối báo cáo đồng nghĩa với việc nội dung <strong>không vi phạm</strong> và
            báo cáo sẽ được đánh dấu đã xử lý (Resolved).
          </p>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Ghi chú cho hồ sơ <span style={{ fontWeight: 400, color: "#9ca3af" }}>(không bắt buộc)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Lý do từ chối báo cáo này..."
            rows={3}
            style={{
              width: "100%", padding: "9px 10px", border: "1px solid #d1d5db",
              borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} onClick={onClose}>Hủy</button>
          <button
            className={styles.lockButton}
            onClick={() => onConfirm(note.trim() || null)}
            style={{ padding: "9px 18px" }}
          >
            <i className="fas fa-times-circle" /> Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ReReviewRequestsPanel ────────────────────────────────── */
function ReReviewRequestsPanel({ onPreview, showToast }) {
  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReq,  setSelectedReq]  = useState(null); // request đang xử lý
  const [comment,      setComment]      = useState("");
  const [processing,   setProcessing]   = useState(false);
  const [actionType,   setActionType]   = useState(null); // "approve" | "reject"
  const [reasonPopup,  setReasonPopup]  = useState(null); // { reason, reviewComment }

  // Lịch sử báo cáo của course đang được xét
  const [courseReports,        setCourseReports]        = useState([]);
  const [courseReportsLoading, setCourseReportsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await getAdminReReviewRequests(statusFilter || undefined);
      if (res.success) setRequests(res.data ?? []);
      else setError(res.errorMessage || "Không thể tải danh sách.");
    } catch (err) {
      setError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openAction = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setComment("");
    // Fetch lịch sử báo cáo của course này
    setCourseReports([]);
    setCourseReportsLoading(true);
    getCourseReports(req.courseId)
      .then(res => { if (res.success) setCourseReports(res.data ?? []); })
      .catch(() => {})
      .finally(() => setCourseReportsLoading(false));
  };

  const handleProcess = async () => {
    if (actionType === "reject" && !comment.trim()) {
      showToast("Vui lòng nhập lý do từ chối.", "error"); return;
    }
    setProcessing(true);
    try {
      const res = actionType === "approve"
        ? await approveReReviewRequest(selectedReq.id, comment)
        : await rejectReReviewRequest(selectedReq.id, comment);

      if (res.success) {
        showToast(actionType === "approve"
          ? "Đã duyệt — khóa học đã được mở khoá và xuất bản lại."
          : "Đã từ chối yêu cầu.");
        setSelectedReq(null);
        fetchRequests();
      } else {
        showToast(res.errorMessage || "Thao tác thất bại.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Đang chờ</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Từ chối</option>
        </select>
        <button className={styles.secondaryButton} onClick={fetchRequests} disabled={loading}>
          <i className="fas fa-rotate-right" /> Tải lại
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Khóa học</th>
              <th>Expert</th>
              <th>Lý do yêu cầu</th>
              <th>Trạng thái</th>
              <th>Ngày gửi</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className={styles.loadingRow}>
                <td colSpan={6}>Đang tải...</td>
              </tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6}>
                <div className={styles.errorState}>
                  <i className="fas fa-triangle-exclamation" />
                  <p>{error}</p>
                  <button className={styles.secondaryButton} onClick={fetchRequests}>Thử lại</button>
                </div>
              </td></tr>
            )}
            {!loading && !error && requests.length === 0 && (
              <tr><td colSpan={6}>
                <div className={styles.emptyState}>
                  <i className="fas fa-inbox" />
                  <p>Không có yêu cầu nào.</p>
                </div>
              </td></tr>
            )}
            {!loading && !error && requests.map(req => (
              <tr key={req.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{req.courseName}</div>
                  {req.isCourseLocked && (
                    <span className={styles.lockedBadge} style={{ marginTop: 4, display: "inline-flex" }}>
                      <i className="fas fa-lock" /> Đang bị khoá
                    </span>
                  )}
                </td>
                <td>
                  <div>{req.expertName || "—"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{req.expertEmail}</div>
                </td>
                <td style={{ maxWidth: 200 }}>
                  <button
                    onClick={() => setReasonPopup({ reason: req.reason, reviewComment: req.reviewComment })}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      color: "#2563eb", fontSize: 13, fontWeight: 600, textAlign: "left",
                      textDecoration: "underline", textUnderlineOffset: 3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: 200, display: "block",
                    }}
                    title="Nhấn để xem đầy đủ"
                  >
                    {req.reason}
                  </button>
                  {req.reviewComment && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      Phản hồi: {req.reviewComment}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`${styles.badge} ${RR_STATUS_CLASS[req.status] ?? styles.statusPending}`}>
                    {RR_STATUS_LABELS[req.status] ?? req.status}
                  </span>
                </td>
                <td>{formatDate(req.createdAt)}</td>
                <td>
                  <div className={styles.actionsCell}>
                    {req.courseId && (
                      <button
                        className={styles.detailButton}
                        onClick={() => onPreview(req.courseId)}
                        title="Xem trước khóa học"
                      >
                        <i className="fas fa-eye" /> Xem course
                      </button>
                    )}
                    {req.status === "Pending" && (
                      <>
                        <button
                          className={styles.resolveButton}
                          onClick={() => openAction(req, "approve")}
                          title="Phê duyệt — mở khoá và publish lại"
                        >
                          <i className="fas fa-check" /> Duyệt
                        </button>
                        <button
                          className={styles.lockButton}
                          onClick={() => openAction(req, "reject")}
                          title="Từ chối yêu cầu"
                        >
                          <i className="fas fa-times" /> Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action modal — Approve / Reject */}
      {selectedReq && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setSelectedReq(null)}>
          <div className={styles.modal} style={{ maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div className={styles.modalHeader}>
              <h2>
                {actionType === "approve"
                  ? <><i className="fas fa-check-circle" style={{ color: "#16a34a", marginRight: 8 }} />Phê duyệt yêu cầu</>
                  : <><i className="fas fa-times-circle" style={{ color: "#dc2626", marginRight: 8 }} />Từ chối yêu cầu</>}
              </h2>
              <button className={styles.closeButton} onClick={() => setSelectedReq(null)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ padding: "0 0 16px" }}>
              <div className={styles.metaItem} style={{ marginBottom: 12 }}>
                <span className={styles.metaLabel}>Khóa học</span>
                <div className={styles.metaValue}>{selectedReq.courseName}</div>
              </div>
              <div className={styles.metaItem} style={{ marginBottom: 12 }}>
                <span className={styles.metaLabel}>Lý do yêu cầu của Expert</span>
                <div className={styles.metaValue} style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>
                  {selectedReq.reason}
                </div>
              </div>

              {/* ── Lịch sử báo cáo của course ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#374151",
                  marginBottom: 6, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <i className="fas fa-flag" style={{ color: "#dc2626" }} />
                  Lịch sử báo cáo của khóa học
                  {!courseReportsLoading && (
                    <span style={{
                      background: courseReports.length > 0 ? "#fee2e2" : "#f3f4f6",
                      color:      courseReports.length > 0 ? "#dc2626" : "#6b7280",
                      borderRadius: 999, fontSize: 11, fontWeight: 700,
                      padding: "1px 7px",
                    }}>
                      {courseReports.length}
                    </span>
                  )}
                </div>

                {courseReportsLoading ? (
                  <div style={{ fontSize: 13, color: "#9ca3af", padding: "6px 0" }}>
                    <i className="fas fa-spinner fa-spin" /> Đang tải...
                  </div>
                ) : courseReports.length === 0 ? (
                  <div style={{
                    fontSize: 13, color: "#6b7280", padding: "8px 12px",
                    background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb",
                  }}>
                    Chưa có báo cáo nào cho khóa học này.
                  </div>
                ) : (
                  <div style={{
                    maxHeight: 180, overflowY: "auto",
                    border: "1px solid #fecaca", borderRadius: 8,
                    background: "#fff",
                  }}>
                    {courseReports.map((rpt, idx) => (
                      <div key={rpt.id} style={{
                        padding: "8px 12px",
                        borderBottom: idx < courseReports.length - 1 ? "1px solid #fee2e2" : "none",
                        fontSize: 13,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <span style={{
                              fontWeight: 600, color: "#b91c1c",
                              marginRight: 6,
                            }}>
                              {getReasonLabel(rpt.reason)}
                            </span>
                            {rpt.contentType === "Learning Material" && rpt.materialName && (
                              <span style={{ fontSize: 11, color: "#6b7280" }}>
                                ({rpt.materialName})
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600,
                              background: rpt.status === "Resolved" ? "#dcfce7" : "#fef9c3",
                              color:      rpt.status === "Resolved" ? "#16a34a" : "#a16207",
                            }}>
                              {rpt.status === "Resolved" ? "Đã xử lý" : "Đang chờ"}
                            </span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>
                              {formatDate(rpt.createdAt)}
                            </span>
                          </div>
                        </div>
                        {rpt.description && (
                          <div style={{ color: "#4b5563", marginTop: 3, fontStyle: "italic" }}>
                            "{rpt.description}"
                          </div>
                        )}
                        {rpt.learnerName && (
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            Báo cáo bởi: {rpt.learnerName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {actionType === "approve" && (
                <div style={{
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  color: "#15803d",
                  fontSize: 13,
                  marginBottom: 12,
                }}>
                  <i className="fas fa-info-circle" /> Sau khi duyệt, khóa học sẽ được <strong>mở khoá và xuất bản lại</strong> ngay lập tức.
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  {actionType === "approve" ? "Ghi chú cho Expert (không bắt buộc)" : "Lý do từ chối *"}
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={actionType === "approve"
                    ? "Nhắc nhở hoặc lưu ý thêm cho Expert..."
                    : "Giải thích rõ lý do từ chối để Expert hiểu và cải thiện..."}
                  rows={3}
                  style={{
                    width: "100%", padding: "9px 10px", border: "1px solid #d1d5db",
                    borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setSelectedReq(null)} disabled={processing}>
                Hủy
              </button>
              <button
                className={actionType === "approve" ? styles.resolveButton : styles.lockButton}
                onClick={handleProcess}
                disabled={processing}
                style={{ padding: "9px 18px" }}
              >
                {processing
                  ? <><i className="fas fa-spinner fa-spin" /> Đang xử lý...</>
                  : actionType === "approve"
                    ? <><i className="fas fa-check" /> Xác nhận duyệt</>
                    : <><i className="fas fa-times" /> Xác nhận từ chối</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reason Popup ── */}
      {reasonPopup && (
        <div className={styles.modalOverlay} onClick={() => setReasonPopup(null)}>
          <div className={styles.modal} style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><i className="fas fa-comment-alt" style={{ marginRight: 8 }} />Lý do yêu cầu</h2>
              <button className={styles.closeButton} onClick={() => setReasonPopup(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className={styles.descriptionBox} style={{ marginBottom: reasonPopup.reviewComment ? 12 : 0 }}>
              {reasonPopup.reason}
            </div>
            {reasonPopup.reviewComment && (
              <div style={{ marginTop: 8 }}>
                <div className={styles.metaLabel} style={{ marginBottom: 6 }}>Phản hồi admin</div>
                <div className={styles.descriptionBox} style={{ color: "#dc2626" }}>
                  {reasonPopup.reviewComment}
                </div>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setReasonPopup(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReportDetailModal({ report, onClose, onResolve, onLock, onUnlock, onPreview, onDismiss, resolving, locking }) {
  if (!report) return null;

  const hasCourse  = !!report.courseId;   // cả course report lẫn content report đều có courseId
  const isLocked   = !!report.isCourseLocked;
  const isResolved = report.status === "Resolved";

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
              {isLocked && (
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

          {/* Nút Lock — có courseId, chưa bị lock, chưa resolved */}
          {hasCourse && !isLocked && !isResolved && (
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

          {/* Nút Unlock — course đang bị lock */}
          {hasCourse && isLocked && report.courseId && (
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

          {/* Nút Resolve — khi không có course hoặc course đã bị lock */}
          {!isResolved && !(hasCourse && !isLocked) && (
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

          {/* Nút Từ chối — bất kỳ report Pending nào */}
          {!isResolved && (
            <button
              className={styles.unlockButton}
              onClick={() => onDismiss(report.id)}
              disabled={resolving}
            >
              <i className="fas fa-times-circle" /> Từ chối báo cáo
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
  const [previewMaterialId, setPreviewMaterialId] = useState(null);

  function openPreview(courseId, materialId = null) {
    setPreviewCourseId(courseId);
    setPreviewMaterialId(materialId ?? null);
  }

  // null | { reportId, reportCourseName }
  const [dismissModal, setDismissModal] = useState(null);

  // "reports" | "review-requests"
  const [activeTab, setActiveTab] = useState("reports");

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

  const handleDismissConfirm = async (note) => {
    if (!dismissModal) return;
    const { reportId } = dismissModal;
    setDismissModal(null);
    setResolvingId(reportId);
    try {
      const res = await dismissAdminReport(reportId, note);
      if (res.success) {
        const nextStatus = res.data?.status || "Resolved";
        setReports((prev) => prev.map((item) =>
          item.id === reportId ? { ...item, status: nextStatus } : item
        ));
        setSelectedReport((prev) =>
          prev && prev.id === reportId
            ? { ...prev, status: nextStatus, resolvedAt: res.data?.resolvedAt }
            : prev
        );
        showToast(res.data?.message || "Đã từ chối báo cáo.");
      } else {
        showToast(res.errorMessage || "Không thể từ chối báo cáo.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setResolvingId("");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Báo cáo nội dung</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Báo cáo nội dung</h1>
            <p className={styles.headerText}>
              Xem danh sách báo cáo và đánh dấu các báo cáo đã được xử lý.
            </p>
          </div>
        </section>

        {/* ── TABS ────────────────────────────────────────────── */}
        <div className={styles.pageTabs}>
          <button
            className={`${styles.pageTab} ${activeTab === "reports" ? styles.pageTabActive : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <i className="fas fa-flag" /> Báo cáo nội dung
          </button>
          <button
            className={`${styles.pageTab} ${activeTab === "review-requests" ? styles.pageTabActive : ""}`}
            onClick={() => setActiveTab("review-requests")}
          >
            <i className="fas fa-file-signature" /> Yêu cầu mở lại khóa học
          </button>
        </div>

        {/* ── TAB: RE-REVIEW REQUESTS ──────────────────────────── */}
        {activeTab === "review-requests" && (
          <ReReviewRequestsPanel
            onPreview={(courseId) => openPreview(courseId, null)}
            showToast={showToast}
          />
        )}

        {/* ── TAB: REPORTS ─────────────────────────────────────── */}
        {activeTab === "reports" && (<>
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
                    {report.isCourseLocked && (
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

                      {/* Nút Xem trước course — content report → chỉ thẳng đến material bị report */}
                      {report.courseId && (
                        <button
                          className={styles.detailButton}
                          onClick={() => openPreview(
                            report.courseId,
                            report.materialId ?? null   // content report có materialId, course report = null
                          )}
                          title={report.materialId
                            ? "Xem trước nội dung bị report trong khóa học"
                            : "Xem trước khóa học"}
                        >
                          <i className="fas fa-search" />
                          {report.materialId ? "Xem nội dung" : "Xem course"}
                        </button>
                      )}

                      {/* Nút Lock — có courseId, chưa bị lock, chưa resolved */}
                      {report.courseId && !report.isCourseLocked && report.status !== "Resolved" && (
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
                      {report.courseId && report.isCourseLocked && (
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

                      {/* Nút Resolve — hiện khi không có courseId hoặc course đã bị lock */}
                      {report.status !== "Resolved" && !(report.courseId && !report.isCourseLocked) && (
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

                      {/* Nút Từ chối — Pending report */}
                      {report.status !== "Resolved" && (
                        <button
                          className={styles.unlockButton}
                          onClick={() => setDismissModal({ reportId: report.id })}
                          title="Từ chối — nội dung không vi phạm"
                        >
                          <i className="fas fa-times-circle" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>)} {/* end tab reports */}

      </div> {/* end container */}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolve={handleResolve}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onPreview={(courseId) => openPreview(courseId, selectedReport?.materialId ?? null)}
          onDismiss={(reportId) => setDismissModal({ reportId })}
          resolving={!!resolvingId}
          locking={!!lockingId}
        />
      )}

      {previewCourseId && (
        <CoursePreviewModal
          courseId={previewCourseId}
          initialMaterialId={previewMaterialId}
          onClose={() => { setPreviewCourseId(null); setPreviewMaterialId(null); }}
          materialPreviewEndpoint={(cId, mId) =>
            `/admin/courses/${cId}/materials/${mId}/preview`}
        />
      )}

      {dismissModal && (
        <DismissModal
          report={dismissModal}
          onClose={() => setDismissModal(null)}
          onConfirm={handleDismissConfirm}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}