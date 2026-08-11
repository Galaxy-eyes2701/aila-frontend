import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./BlogManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import BlogFormModal from "./BlogFormModal";
import Pagination from "@presentation/components/Pagination/Pagination";
import {
  getBlogs,
  getBlogDetail,
  deleteBlog,
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
      setPageError(err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.");
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
      showToast(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleTogglePublish(blog) {
    const action = blog.isPublished ? unpublishBlog : publishBlog;
    const confirmMessage = blog.isPublished
      ? `Bỏ công khai bài viết "${blog.title}"?`
      : `Công khai bài viết "${blog.title}"?`;

    if (!window.confirm(confirmMessage)) return;

    setBusyBlogId(blog.id);
    try {
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
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setBusyBlogId("");
    }
  }

  async function handleDelete(blog) {
    if (
      !window.confirm(
        `Xóa bài viết "${blog.title}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;

    setBusyBlogId(blog.id);
    try {
      const res = await deleteBlog(blog.id);
      if (res.success) {
        showToast("Đã xóa bài viết.");
        if (blogs.length === 1 && pageNumber > 1) {
          setPageNumber((p) => p - 1);
        } else {
          fetchBlogs();
        }
      } else {
        showToast(res.errorMessage || "Không thể xóa bài viết.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setBusyBlogId("");
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

                        <button
                          className={styles.dangerButton}
                          disabled={busyBlogId === blog.id}
                          onClick={() => handleDelete(blog)}
                        >
                          <i className="fas fa-trash" />
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

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
