import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@services/api';
import Pagination from '@presentation/components/Pagination/Pagination';
import styles from './BlogList.module.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function BlogSkeleton({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className={styles.skeletonCard}>
      <div className={`${styles.skeletonBlock} ${styles.skeletonThumb}`} />
      <div style={{ padding: 20 }}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} style={{ width: '35%', marginBottom: 12 }} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} style={{ width: '70%' }} />
      </div>
    </div>
  ));
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function BlogList() {
  const navigate       = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ──
  const [blogs, setBlogs]           = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // ── Search & Pagination ──
  const [search, setSearch]         = useState(searchParams.get('search') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '');
  const [currentPage, setCurrentPage]   = useState(Number(searchParams.get('page') ?? 1));
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get('size') ?? 9));

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Debounce search
  const debounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  const clearSearch = () => {
    setInputValue('');
    setSearch('');
    setCurrentPage(1);
  };

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (search)            params.search = search;
    if (currentPage !== 1) params.page   = currentPage;
    if (itemsPerPage !== 9) params.size   = itemsPerPage;
    setSearchParams(params, { replace: true });
  }, [search, currentPage, itemsPerPage]);

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // API: GET /api/blogs?Search=...&PageRequest.PageIndex=...&PageRequest.PageSize=...
      const params = new URLSearchParams();
      if (search) params.set('Search', search);
      params.set('PageRequest.PageIndex', String(currentPage));
      params.set('PageRequest.PageSize',  String(itemsPerPage));  

      const res = await api.get(`/blogs?${params.toString()}`);
      const d   = res.data;
      const pageResult = res.data.data;
      const validItems = (pageResult?.items ?? []).filter(b => b.id);
      setBlogs(validItems);
      setTotalItems(pageResult?.totalItems ?? 0);
      if (d.success) {
        const pageResult = d.data;
        setBlogs(pageResult?.items ?? []);
        setTotalItems(pageResult?.totalItems ?? 0);
      } else {
        setError(d.errorMessage || 'Không thể tải danh sách bài viết.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  // Reset page khi đổi itemsPerPage
  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
          <i className="fas fa-chevron-right" />
          <span>Blog</span>
        </div>

        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Bài viết</h1>
          <p className={styles.pageDesc}>
            Khám phá các bài viết về AI, công nghệ và xu hướng học tập mới nhất.
          </p>
        </div>

        {/* Toolbar: search + total */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <i className={`fas fa-search ${styles.searchIcon}`} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={inputValue}
              onChange={handleSearchChange}
            />
            {inputValue && (
              <button className={styles.clearBtn} onClick={clearSearch} aria-label="Xóa">
                <i className="fas fa-times" />
              </button>
            )}
          </div>
          {!loading && (
            <span className={styles.totalCount}>
              {totalItems} bài viết
            </span>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '20px 24px', borderRadius: 'var(--radius-sm)',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: 14, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <i className="fas fa-exclamation-circle" />
            {error}
            <button
              onClick={fetchBlogs}
              style={{ marginLeft: 'auto', color: '#dc2626', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Blog grid */}
        <div className={styles.grid}>
          {loading ? (
            <BlogSkeleton count={itemsPerPage > 6 ? 6 : itemsPerPage} />
          ) : blogs.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className="fas fa-newspaper" /></div>
              <p className={styles.emptyTitle}>
                {search ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
              </p>
              <p className={styles.emptyDesc}>
                {search
                  ? `Không có kết quả nào cho "${search}"`
                  : 'Các bài viết mới sẽ xuất hiện tại đây.'}
              </p>
              {search && (
                <button className={styles.clearSearchBtn} onClick={clearSearch}>
                  Xóa tìm kiếm
                </button>
              )}
            </div>
          ) : (
            blogs.map(blog => (
              <Link
                key={blog.id}
                to={`/blogs/${blog.id}`}
                className={styles.card}
              >
                {/* Thumbnail */}
                <div className={styles.thumbnail}>
                  {blog.thumbnailUrl
                    ? <img src={blog.thumbnailUrl} alt={blog.title} />
                    : <div className={styles.thumbFallback}>
                        <i className="fas fa-newspaper" />
                      </div>}
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.authorBadge}>
                      <i className="fas fa-user-edit" />
                      {blog.authorName}
                    </span>
                    {blog.createdAt && (
                      <span className={styles.dateBadge}>
                        <i className="fas fa-calendar-alt" />
                        {formatDate(blog.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardTitle}>{blog.title}</div>

                  <span className={styles.readMore}>
                    Đọc bài viết <i className="fas fa-arrow-right" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

      </div>
    </div>
  );
}