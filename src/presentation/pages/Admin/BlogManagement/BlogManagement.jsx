import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveApiError } from "@services/api";
import styles from "./BlogManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import BlogFormModal from "./BlogFormModal";
import ConfirmModal from "@presentation/components/ConfirmModal/ConfirmModal";
import Pagination from "@presentation/components/Pagination/Pagination";
import {
  getBlogs,
  getBlogDetail,
  publishBlog,
  unpublishBlog,
} from "@services/blogApi";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [busyBlogId, setBusyBlogId] = useState("");

  const [formModal, setFormModal] = useState(null);
  const PAGE_SIZE = 10;
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getBlogs({
        search: searchKeyword.trim() || undefined,
        pageNumber,
        pageSize,
      });

      if (res.success) {
        setBlogs(res.data?.items ?? res.data?.Items ?? []);
        setTotalCount(res.data?.totalCount ?? res.data?.TotalCount ?? 0);
      } else {
        setPageError(res.errorMessage || "Không thể tải danh sách blog.");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setPageError(errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, pageNumber, pageSize]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPageNumber(1);
    setSearchKeyword(searchInput);
  }

  function openCreateModal() {
    setFormModal({ mode: "create", blog: null });
  }

  async function openEditModal(blog) {
    setDetailLoading(true);
    try {
      const res = await getBlogDetail(blog.id);
      if (res.success) {
        setFormModal({ mode: "edit", blog: res.data });
      } else {
        showToast(res.errorMessage || "Không thể tải chi tiết blog.", "error");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      showToast(
        errorMessage || "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const [confirmState, setConfirmState] = useState(null);

  function handleTogglePublish(blog) {
    setConfirmState({
      type: "publish",
      blog,
      title: blog.isPublished ? "Bỏ công khai bài viết?" : "Công khai bài viết?",
      description: blog.isPublished
        ? `Bạn có chắc muốn bỏ công khai bài viết "${blog.title}"? Bài viết sẽ bị ẩn khỏi trang chính.`
        : `Bạn có chắc muốn công khai bài viết "${blog.title}"? Độc giả sẽ có thể đọc bài viết này.`,
      tone: blog.isPublished ? "warning" : "primary",
      confirmLabel: blog.isPublished ? "Bỏ công khai" : "Công khai",
      icon: blog.isPublished ? "fa-eye-slash" : "fa-eye",
    });
  }

  async function executeConfirmAction() {
    if (!confirmState) return;
    const { type, blog } = confirmState;
    setBusyBlogId(blog.id);

    try {
      if (type === "publish") {
        const action = blog.isPublished ? unpublishBlog : publishBlog;
        const res = await action(blog.id);
        if (res.success) {
          setBlogs((prev) =>
            prev.map((b) =>
              b.id === blog.id ? { ...b, isPublished: !blog.isPublished } : b,
            ),
          );
          showToast(
            blog.isPublished
              ? "Đã bỏ công khai bài viết."
              : "Đã công khai bài viết.",
          );
        } else {
          showToast(res.errorMessage || "Không thể đổi trạng thái.", "error");
        }
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      showToast(errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setBusyBlogId("");
      setConfirmState(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý bài viết</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý bài viết</h1>
            <p className={styles.headerText}>
              Tạo, chỉnh sửa, công khai và quản lý các bài viết blog của hệ
              thống.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={openCreateModal}>
            <i className="fas fa-plus" />
            Viết bài mới
          </button>
        </section>

        <div className={styles.filterBar}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc slug..."
            />
            <button type="submit" className={styles.secondaryButton}>
              <i className="fas fa-search" />
            </button>
          </form>

          <button
            className={styles.secondaryButton}
            onClick={fetchBlogs}
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
                <th>Bài viết</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={styles.loadingRow}>
                    <td colSpan={5}>
                      <div className={styles.skeletonRow}>
                        <div className={styles.skeletonThumb} />
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
                        onClick={fetchBlogs}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && blogs.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-newspaper" />
                      <p>Không tìm thấy bài viết nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !pageError &&
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <div className={styles.blogCell}>
                        {blog.thumbnailUrl ? (
                          <img
                            src={blog.thumbnailUrl}
                            alt={blog.title}
                            className={styles.thumbnail}
                          />
                        ) : (
                          <div className={styles.thumbnailPlaceholder}>
                            <i className="fas fa-image" />
                          </div>
                        )}
                        <div className={styles.blogInfo}>
                          <span className={styles.blogTitle}>{blog.title}</span>
                          <span className={styles.blogSlug}>/{blog.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${styles.badge} ${
                          blog.isPublished
                            ? styles.statusPublished
                            : styles.statusDraft
                        }`}
                      >
                        {blog.isPublished ? "Đã công khai" : "Bản nháp"}
                      </span>
                    </td>

                    <td>{blog.viewCount ?? 0}</td>

                    <td>{formatDate(blog.createdAt)}</td>

                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.iconActionButton}
                          disabled={busyBlogId === blog.id || detailLoading}
                          onClick={() => openEditModal(blog)}
                          title="Sửa"
                        >
                          <i className="fas fa-pen" />
                        </button>

                        <button
                          className={`${styles.toggleButton} ${
                            blog.isPublished
                              ? styles.toggleButtonDeactivate
                              : styles.toggleButtonActivate
                          }`}
                          disabled={busyBlogId === blog.id}
                          onClick={() => handleTogglePublish(blog)}
                        >
                          <i
                            className={`fas ${
                              blog.isPublished ? "fa-eye-slash" : "fa-eye"
                            }`}
                          />
                          {blog.isPublished ? "Bỏ công khai" : "Công khai"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            unitLabel="bài viết"
          />
        )}
      </div>

      {formModal && (
        <BlogFormModal
          mode={formModal.mode}
          blog={formModal.blog}
          onClose={() => setFormModal(null)}
          onSaved={(message) => {
            setFormModal(null);
            fetchBlogs();
            showToast(message);
          }}
        />
      )}

      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          tone={confirmState.tone}
          icon={confirmState.icon}
          confirmLabel={confirmState.confirmLabel}
          busy={busyBlogId === confirmState.blog.id}
          onConfirm={executeConfirmAction}
          onClose={() => setConfirmState(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
