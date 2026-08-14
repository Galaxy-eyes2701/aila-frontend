import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TagManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import {
  createSystemTag,
  deleteSystemTag,
  getPendingTagVerificationDetail,
  getPendingTagVerificationRequests,
  getSystemTags,
  reviewTagVerificationRequest,
  updateSystemTag,
} from "@services/tagApi";

const emptyForm = { name: "" };

function TagFormModal({ mode, initialData, onClose, onSaved }) {
  const [form, setForm] = useState(initialData ?? emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
    setError("");
  }, [initialData]);

  const validate = () => {
    const name = (form.name ?? "").trim();
    if (!name) return "Tên tag không được để trống.";
    if (name.length < 2) return "Tên tag phải có ít nhất 2 ký tự.";
    if (name.length > 100) return "Tên tag không được vượt quá 100 ký tự.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = { name: (form.name ?? "").trim() };
      const res =
        mode === "edit"
          ? await updateSystemTag(initialData.id, payload)
          : await createSystemTag(payload);

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.errorMessage || "Không thể lưu tag.");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{mode === "edit" ? "Chỉnh sửa tag" : "Tạo tag hệ thống mới"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên tag</label>
            <input
              name="name"
              value={form.name ?? ""}
              onChange={(e) => {
                setError("");
                setForm({ ...form, name: e.target.value });
              }}
              placeholder="Nhập tên tag"
              autoFocus
            />
          </div>

          {error && (
            <div className={styles.formError}>
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang lưu...
                </>
              ) : (
                <>{mode === "edit" ? "Cập nhật tag" : "Tạo tag mới"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Nhãn tiếng Việt cho TagPublishRequestStatus (Pending/Approved/Rejected)
const REQUEST_STATUS_LABEL = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
};

function ReviewTagModal({ request, detailLoading, reviewing, onClose, onSubmit }) {
  const [decision, setDecision] = useState("Approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDecision("Approved");
    setRejectionReason("");
    setError("");
  }, [request?.id]);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (decision === "Rejected" && !rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }

    // BE nhận field "note" (không phải "rejectionReason")
    await onSubmit({
      status: decision,
      note: decision === "Rejected" ? rejectionReason.trim() : undefined,
    });
  };

  const statusLabel = REQUEST_STATUS_LABEL[request.requestStatus] || request.requestStatus || "Chờ duyệt";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Duyệt yêu cầu xác minh tag</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {detailLoading ? (
          <div className={styles.emptyState}>
            <i className="fas fa-spinner fa-spin" />
            <p>Đang tải chi tiết yêu cầu...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.detailGrid}>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Tên tag</span>
                <div className={styles.detailValue}>{request.name || "—"}</div>
              </div>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Mã tag</span>
                <div className={styles.detailValue}>{request.code || "—"}</div>
              </div>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Người gửi</span>
                <div className={styles.detailValue}>{request.submittedBy || "—"}</div>
              </div>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Trạng thái</span>
                <div className={styles.detailValue}>{statusLabel}</div>
              </div>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Ngày gửi</span>
                <div className={styles.detailValue}>
                  {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString("vi-VN") : "—"}
                </div>
              </div>
            </div>

            {/* BE trả field "note" (ghi chú của request), không phải "reason" */}
            {request.note && (
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Ghi chú</span>
                <div className={styles.detailValue}>{request.note}</div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Hành động</label>
              <div className={styles.optionGroup}>
                <label className={styles.optionItem}>
                  <input
                    type="radio"
                    name="reviewDecision"
                    value="Approved"
                    checked={decision === "Approved"}
                    onChange={() => setDecision("Approved")}
                  />
                  <span>Phê duyệt</span>
                </label>
                <label className={styles.optionItem}>
                  <input
                    type="radio"
                    name="reviewDecision"
                    value="Rejected"
                    checked={decision === "Rejected"}
                    onChange={() => setDecision("Rejected")}
                  />
                  <span>Từ chối</span>
                </label>
              </div>
            </div>

            {decision === "Rejected" && (
              <div className={styles.formGroup}>
                <label>Lý do từ chối</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setError("");
                    setRejectionReason(e.target.value);
                  }}
                  placeholder="Nhập lý do từ chối"
                />
              </div>
            )}

            {error && (
              <div className={styles.formError}>
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={reviewing}>
                Hủy
              </button>
              <button type="submit" className={styles.primaryButton} disabled={reviewing}>
                {reviewing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Đang xử lý...
                  </>
                ) : (
                  decision === "Rejected" ? "Từ chối yêu cầu" : "Phê duyệt"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TagManagement() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [busyTagId, setBusyTagId] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getSystemTags({
        searchKeyword: searchKeyword.trim() || undefined,
      });

      if (res.success) {
        setTags(res.data ?? []);
      } else {
        setPageError(res.errorMessage || "Không thể tải danh sách tags.");
      }
    } catch (err) {
      setPageError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  const fetchPendingRequests = useCallback(async () => {
    setPendingLoading(true);
    setPendingError("");

    try {
      const res = await getPendingTagVerificationRequests({
        searchKeyword: searchKeyword.trim() || undefined,
      });

      if (res.success) {
        setPendingRequests(res.data ?? []);
      } else {
        setPendingError(res.errorMessage || "Không thể tải danh sách yêu cầu xác minh.");
      }
    } catch (err) {
      setPendingError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setPendingLoading(false);
    }
  }, [searchKeyword]);

  useEffect(() => {
    fetchTags();
    fetchPendingRequests();
  }, [fetchTags, fetchPendingRequests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingTag(null);
  };

  const handleOpenEdit = (tag) => {
    setModalMode("edit");
    setEditingTag(tag);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingTag(null);
  };

  const handleSavedTag = () => {
    handleCloseModal();
    fetchTags();
    fetchPendingRequests();
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tag này không?")) return;

    setBusyTagId(tagId);
    try {
      const res = await deleteSystemTag(tagId);
      if (res.success) {
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      } else {
        alert(res.errorMessage || "Không thể xóa tag.");
      }
    } catch (err) {
      alert(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setBusyTagId("");
    }
  };

  const handleOpenReview = async (request) => {
    setReviewModalOpen(true);
    setSelectedRequest(request);
    setDetailLoading(true);

    try {
      const res = await getPendingTagVerificationDetail(request.id);
      if (res.success) {
        setSelectedRequest(res.data ?? request);
      } else {
        showToast(res.errorMessage || "Không thể tải chi tiết yêu cầu.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReviewSubmit = async (payload) => {
    if (!selectedRequest) return;

    setReviewingRequestId(selectedRequest.id);

    try {
      const res = await reviewTagVerificationRequest(selectedRequest.id, payload);
      if (res.success) {
        setPendingRequests((prev) => prev.filter((item) => item.id !== selectedRequest.id));
        setReviewModalOpen(false);
        setSelectedRequest(null);
        showToast(payload.status === "Approved" ? "Đã phê duyệt yêu cầu tag." : "Đã từ chối yêu cầu tag.");
        fetchTags();
        fetchPendingRequests();
      } else {
        showToast(res.errorMessage || "Không thể xử lý yêu cầu này.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setReviewingRequestId("");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý tags</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý tags</h1>
            <p className={styles.headerText}>
              Duyệt, tạo, chỉnh sửa và xóa system tags trong hệ thống.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={handleOpenCreate}>
            <i className="fas fa-tag" />
            Tạo tag mới
          </button>
        </section>

        <div className={styles.filterBar}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên tag..."
            />
            <button type="submit" className={styles.secondaryButton}>
              <i className="fas fa-search" />
            </button>
          </form>

          <button className={styles.secondaryButton} onClick={() => { fetchTags(); fetchPendingRequests(); }} disabled={loading || pendingLoading}>
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.requestSection}>
          <div className={styles.sectionHeader}>
            <h2>Yêu cầu xác minh tag chờ duyệt</h2>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên tag</th>
                  <th>Mã tag</th>
                  <th>Người gửi</th>
                  <th>Ngày gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoading && (
                  <tr className={styles.loadingRow}>
                    <td colSpan={5}>Đang tải yêu cầu xác minh...</td>
                  </tr>
                )}

                {!pendingLoading && pendingError && (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.errorState}>
                        <i className="fas fa-triangle-exclamation" />
                        <p>{pendingError}</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!pendingLoading && !pendingError && pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.emptyState}>
                        <i className="fas fa-clipboard-check" />
                        <p>Không có yêu cầu xác minh nào đang chờ.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!pendingLoading && !pendingError && pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.name}</td>
                    <td>{request.code || "—"}</td>
                    <td>{request.submittedBy || "—"}</td>
                    <td>{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button className={styles.secondaryButton} onClick={() => handleOpenReview(request)}>
                          <i className="fas fa-eye" /> Chi tiết
                        </button>
                        <button
                          className={styles.primaryButton}
                          onClick={() => handleOpenReview(request)}
                          disabled={reviewingRequestId === request.id}
                        >
                          <i className="fas fa-check" /> Duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <h2>Tags hệ thống</h2>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên tag</th>
                <th>Trạng thái</th>
                <th>Lượt dùng</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className={styles.loadingRow}>
                  <td colSpan={5}>Đang tải danh sách tags...</td>
                </tr>
              )}

              {!loading && pageError && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button className={styles.secondaryButton} onClick={fetchTags}>
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && tags.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-tags" />
                      <p>Không tìm thấy tag nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError &&
                tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.name}</td>
                    <td>
                      {/* SystemTagDto trả "isPublished", không có "isSystemTag" */}
                      <span
                        className={`${styles.badge} ${tag.isPublished ? styles.systemBadge : ""}`}
                      >
                        {tag.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                      </span>
                    </td>
                    <td>{tag.usageCount ?? 0}</td>
                    <td>{tag.createdAt ? new Date(tag.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button className={styles.secondaryButton} onClick={() => handleOpenEdit(tag)}>
                          <i className="fas fa-pen" /> Chỉnh sửa
                        </button>
                        <button
                          className={`${styles.secondaryButton} ${styles.dangerButton}`}
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={busyTagId === tag.id}
                        >
                          <i className="fas fa-trash" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modalMode === "create" || modalMode === "edit") && (
        <TagFormModal
          mode={modalMode}
          initialData={editingTag}
          onClose={handleCloseModal}
          onSaved={handleSavedTag}
        />
      )}

      {reviewModalOpen && (
        <ReviewTagModal
          request={selectedRequest}
          detailLoading={detailLoading}
          reviewing={!!reviewingRequestId}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}