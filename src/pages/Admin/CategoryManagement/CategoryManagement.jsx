import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CategoryManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import {
  changeCategoryStatus,
  createAdminCategory,
  getAdminCategories,
  reorderAdminCategories,
  updateAdminCategory,
} from "../services/categoryApi";

const emptyForm = { name: "", description: "", orderIndex: 1 };

function CategoryFormModal({ mode, initialData, onClose, onSaved }) {
  const [form, setForm] = useState(initialData ?? emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
    setError("");
  }, [initialData]);

  const validate = () => {
    const name = form.name?.trim() || "";
    if (!name) return "Tên danh mục không được để trống.";
    if (name.length < 2) return "Tên danh mục phải có ít nhất 2 ký tự.";
    if (name.length > 100) return "Tên danh mục không được vượt quá 100 ký tự.";

    const orderIndex = Number(form.orderIndex ?? 1);
    if (!Number.isInteger(orderIndex) || orderIndex < 1) {
      return "Vị trí sắp xếp phải là số nguyên lớn hơn 0.";
    }
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
      const payload =
        mode === "edit"
          ? {
              name: form.name.trim(),
              description: form.description?.trim() || "",
            }
          : {
              name: form.name.trim(),
              description: form.description?.trim() || "",
              orderIndex: Number(form.orderIndex || 1),
            };

      const res =
        mode === "edit"
          ? await updateAdminCategory(initialData.id, payload)
          : await createAdminCategory(payload);

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.errorMessage || "Không thể lưu danh mục.");
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
          <h2>{mode === "edit" ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên danh mục</label>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nhập tên danh mục"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả danh mục"
            />
          </div>

          {mode === "create" && (
            <div className={styles.formGroup}>
              <label>Vị trí sắp xếp</label>
              <input
                type="number"
                min="1"
                value={form.orderIndex ?? 1}
                onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })}
                placeholder="1"
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
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang lưu...
                </>
              ) : (
                mode === "edit" ? "Cập nhật" : "Tạo danh mục"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [busyCategoryId, setBusyCategoryId] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getAdminCategories();
      if (res.success) {
        setCategories((res.data ?? []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
      } else {
        setPageError(res.errorMessage || "Không thể tải danh sách danh mục.");
      }
    } catch (err) {
      setPageError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [categories]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingCategory(null);
  };

  const handleOpenEdit = (category) => {
    setModalMode("edit");
    setEditingCategory(category);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingCategory(null);
  };

  const handleSaved = async () => {
    handleCloseModal();
    await fetchCategories();
  };

  const handleToggleStatus = async (category) => {
    if (!window.confirm(`Bạn có chắc muốn ${category.isActive ? "vô hiệu hóa" : "kích hoạt"} danh mục này không?`)) {
      return;
    }

    setBusyCategoryId(category.id);
    try {
      const res = await changeCategoryStatus(category.id, !category.isActive);
      if (res.success) {
        setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, isActive: !category.isActive } : item)));
        showToast(category.isActive ? "Đã vô hiệu hóa danh mục." : "Đã kích hoạt danh mục.");
      } else {
        showToast(res.errorMessage || "Không thể cập nhật trạng thái.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setBusyCategoryId("");
    }
  };

  const handleMove = async (categoryId, direction) => {
    const currentIndex = sortedCategories.findIndex((item) => item.id === categoryId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const next = [...sortedCategories];
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);

    const nextIds = next.map((item) => item.id);
    setBusyCategoryId(categoryId);

    try {
      const res = await reorderAdminCategories(nextIds);
      if (res.success) {
        const reordered = next.map((item, index) => ({ ...item, orderIndex: index + 1 }));
        setCategories(reordered);
        showToast("Đã cập nhật thứ tự danh mục.");
      } else {
        showToast(res.errorMessage || "Không thể sắp xếp lại danh mục.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setBusyCategoryId("");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý course category</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý course category</h1>
            <p className={styles.headerText}>
              Tạo, chỉnh sửa, kích hoạt/vô hiệu hóa và sắp xếp lại danh mục khóa học.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={handleOpenCreate}>
            <i className="fas fa-folder-plus" />
            Tạo danh mục mới
          </button>
        </section>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Số khóa học</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className={styles.loadingRow}>
                  <td colSpan={6}>Đang tải danh sách danh mục...</td>
                </tr>
              )}

              {!loading && pageError && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button className={styles.secondaryButton} onClick={fetchCategories}>
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && sortedCategories.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-folder-open" />
                      <p>Chưa có danh mục nào.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && sortedCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || "—"}</td>
                  <td>{category.courseCount ?? 0}</td>
                  <td>{category.orderIndex ?? "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${category.isActive ? styles.statusActive : styles.statusInactive}`}>
                      {category.isActive ? "Đang hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button className={styles.iconButton} onClick={() => handleOpenEdit(category)}>
                        <i className="fas fa-edit" /> Sửa
                      </button>
                      <button
                        className={`${styles.iconButton} ${!category.isActive ? styles.dangerButton : ""}`}
                        onClick={() => handleToggleStatus(category)}
                        disabled={busyCategoryId === category.id}
                      >
                        <i className={`fas ${category.isActive ? "fa-ban" : "fa-check"}`} />
                        {category.isActive ? "Ẩn" : "Kích hoạt"}
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleMove(category.id, "up")}
                        disabled={busyCategoryId === category.id || sortedCategories.findIndex((item) => item.id === category.id) === 0}
                      >
                        <i className="fas fa-arrow-up" />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleMove(category.id, "down")}
                        disabled={busyCategoryId === category.id || sortedCategories.findIndex((item) => item.id === category.id) === sortedCategories.length - 1}
                      >
                        <i className="fas fa-arrow-down" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <CategoryFormModal
          mode={modalMode}
          initialData={modalMode === "edit" ? editingCategory : { ...emptyForm }}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
