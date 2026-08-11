import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CategoryManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import Pagination from "@presentation/components/Pagination/Pagination";
import {
  changeCategoryStatus,
  createAdminCategory,
  getAdminCategories,
  reorderAdminCategories,
  updateAdminCategory,
} from "@services/categoryApi";

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
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
                onChange={(e) =>
                  setForm({ ...form, orderIndex: Number(e.target.value) })
                }
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
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang lưu...
                </>
              ) : mode === "edit" ? (
                "Cập nhật"
              ) : (
                "Tạo danh mục"
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

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getAdminCategories();
      if (res.success) {
        setCategories(
          (res.data ?? [])
            .slice()
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
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
    return [...categories].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );
  }, [categories]);

  // Search filters the already-loaded list (category count is small; no server-side search endpoint).
  const filteredCategories = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return sortedCategories;
    return sortedCategories.filter((c) =>
      (c.name || "").toLowerCase().includes(keyword),
    );
  }, [sortedCategories, searchKeyword]);

  const totalCount = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Client-side pagination, since getAdminCategories returns the full list.
  const pagedCategories = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, pageNumber, pageSize]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPageNumber(1);
    setSearchKeyword(searchInput);
  }

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
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          category.isActive ? "vô hiệu hóa" : "kích hoạt"
        } danh mục "${category.name}" không?`,
      )
    ) {
      return;
    }

    setBusyCategoryId(category.id);
    try {
      const res = await changeCategoryStatus(category.id, !category.isActive);
      if (res.success) {
        setCategories((prev) =>
          prev.map((item) =>
            item.id === category.id
              ? { ...item, isActive: !category.isActive }
              : item,
          ),
        );
        showToast(
          category.isActive
            ? "Đã vô hiệu hóa danh mục."
            : "Đã kích hoạt danh mục.",
        );
      } else {
        // BR-01: BE từ chối vô hiệu hóa danh mục đang có khóa học (CATEGORY_HAS_COURSES)
        showToast(res.errorMessage || "Không thể cập nhật trạng thái.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setBusyCategoryId("");
    }
  };

  const handleMove = async (categoryId, direction) => {
    const currentIndex = sortedCategories.findIndex(
      (item) => item.id === categoryId,
    );
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
        // ReorderCategoriesCommandHandler gán orderIndex 0-based (category.ChangeOrder(i), i bắt đầu từ 0),
        // nên không tự tính lại orderIndex ở FE (dễ lệch 1 đơn vị) — load lại từ server cho chính xác.
        await fetchCategories();
        showToast("Đã cập nhật thứ tự danh mục.");
      } else {
        showToast(res.errorMessage || "Không thể sắp xếp lại danh mục.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.",
        "error",
      );
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
          <span>Quản lý danh mục khóa học</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý danh mục khóa học</h1>
            <p className={styles.headerText}>
              Tạo, chỉnh sửa, kích hoạt/vô hiệu hóa và sắp xếp lại danh mục
              khóa học.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={handleOpenCreate}>
            <i className="fas fa-folder-plus" />
            Tạo danh mục mới
          </button>
        </section>

        <div className={styles.filterBar}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên danh mục..."
            />
            <button type="submit" className={styles.secondaryButton}>
              <i className="fas fa-search" />
            </button>
          </form>

          <button
            className={styles.secondaryButton}
            onClick={fetchCategories}
            disabled={loading}
          >
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={styles.loadingRow}>
                    <td colSpan={5}>
                      <div className={styles.skeletonRow}>
                        <div className={styles.skeletonLine} />
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && pageError && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button
                        className={styles.secondaryButton}
                        onClick={fetchCategories}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && pagedCategories.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-folder-open" />
                      <p>
                        {searchKeyword
                          ? "Không tìm thấy danh mục nào phù hợp."
                          : "Chưa có danh mục nào."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !pageError &&
                pagedCategories.map((category) => {
                  const globalIndex = sortedCategories.findIndex(
                    (item) => item.id === category.id,
                  );
                  return (
                    <tr key={category.id}>
                      <td>
                        <span className={styles.categoryName}>
                          {category.name}
                        </span>
                      </td>
                      <td>
                        <span className={styles.descriptionCell}>
                          {category.description || "—"}
                        </span>
                      </td>
                      <td>{category.orderIndex ?? "—"}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            category.isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {category.isActive ? "Đang hiển thị" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.iconActionButton}
                            disabled={
                              busyCategoryId === category.id ||
                              globalIndex === 0
                            }
                            onClick={() =>
                              handleMove(category.id, "up")
                            }
                            title="Di chuyển lên"
                          >
                            <i className="fas fa-arrow-up" />
                          </button>
                          <button
                            className={styles.iconActionButton}
                            disabled={
                              busyCategoryId === category.id ||
                              globalIndex === sortedCategories.length - 1
                            }
                            onClick={() => handleMove(category.id, "down")}
                            title="Di chuyển xuống"
                          >
                            <i className="fas fa-arrow-down" />
                          </button>

                          <button
                            className={styles.iconActionButton}
                            disabled={busyCategoryId === category.id}
                            onClick={() => handleOpenEdit(category)}
                            title="Sửa"
                          >
                            <i className="fas fa-pen" />
                          </button>

                          <button
                            className={`${styles.toggleButton} ${
                              category.isActive
                                ? styles.toggleButtonDeactivate
                                : styles.toggleButtonActivate
                            }`}
                            disabled={busyCategoryId === category.id}
                            onClick={() => handleToggleStatus(category)}
                          >
                            <i
                              className={`fas ${
                                category.isActive ? "fa-ban" : "fa-check"
                              }`}
                            />
                            {category.isActive ? "Ẩn" : "Kích hoạt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && !pageError && totalCount > 0 && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            itemsPerPage={pageSize}
            totalItems={totalCount}
            onPageChange={setPageNumber}
            onItemsPerPageChange={(n) => {
              setPageSize(n);
              setPageNumber(1);
            }}
            unitLabel="danh mục"
          />
        )}
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