import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TagManagement.module.css";
import {
  createSystemTag,
  deleteSystemTag,
  getSystemTags,
  updateSystemTag,
} from "../services/tagApi";

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
    const name = form.name.trim();
    if (!name) return "Tên tag không được để trống.";
    if (name.length < 2) return "Tên tag phải có ít nhất 2 ký tự.";
    if (name.length > 50) return "Tên tag không được vượt quá 50 ký tự.";
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
      const payload = { name: form.name.trim() };
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
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{mode === "edit" ? "Chỉnh sửa tag" : "Tạo system tag mới"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên tag</label>
            <input
              name="name"
              value={form.name}
              onChange={(e) => {
                setError("");
                setForm({ name: e.target.value });
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

export default function TagManagement() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [busyTagId, setBusyTagId] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingTag, setEditingTag] = useState(null);

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

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

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

          <button className={styles.secondaryButton} onClick={fetchTags} disabled={loading}>
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên tag</th>
                <th>Loại</th>
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
                      <span className={`${styles.badge} ${styles.systemBadge}`}>
                        {tag.isSystemTag ? "System" : "Custom"}
                      </span>
                    </td>
                    <td>{tag.usageCount ?? 0}</td>
                    <td>{new Date(tag.createdAt).toLocaleDateString("vi-VN")}</td>
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
    </div>
  );
}
