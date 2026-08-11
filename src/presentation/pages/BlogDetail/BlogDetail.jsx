import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '@services/api';
import styles from './BlogDetail.module.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatViews(count) {
  return count.toLocaleString('vi-VN');
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function BlogSkeleton() {
  return (
    <div className={styles.article}>
      <div className={`${styles.skeletonBlock} ${styles.skeletonCover}`} />
      <div className={styles.body}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} style={{ width: '75%' }} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} style={{ width: '50%', height: 20, marginBottom: 24 }} />
        <div style={{ borderTop: '1px solid #eee', marginBottom: 36 }} />
        {[100, 90, 95, 80, 100, 70, 85].map((w, i) => (
          <div key={i} className={`${styles.skeletonBlock} ${styles.skeletonLine}`} style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Inner component — nhận id qua prop, remount khi id thay đổi (key) ───── */
function BlogDetailInner({ id }) {
  const navigate = useNavigate();
  const [blog, setBlog]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;

    api.get(`/blogs/${id}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data.success) {
          setBlog(res.data.data);
        } else {
          setError(res.data.errorMessage || 'Không thể tải bài viết.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.data?.errorCode;
        if (err.response?.status === 404 || code === 'BLOG_NOT_FOUND' || code === 'NOT_FOUND') {
          navigate('/404', { replace: true });
        } else {
          setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id, navigate]);

  /* loading */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">Trang chủ</Link>
            <i className="fas fa-chevron-right" />
            <span>Blog</span>
            <i className="fas fa-chevron-right" />
            <span>Đang tải...</span>
          </div>
          <BlogSkeleton />
        </div>
      </div>
    );
  }

  /* error */
  if (error) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.errorBox}>
            <div className={styles.errorIcon}><i className="fas fa-exclamation-circle" /></div>
            <p className={styles.errorTitle}>Không thể tải bài viết</p>
            <p className={styles.errorDesc}>{error}</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
              <i className="fas fa-redo" /> Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const displayDate = formatDate(blog.publishedAt ?? blog.createdAt);
  const safeHtml    = DOMPurify.sanitize(blog.content);

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
          <i className="fas fa-chevron-right" />
          <span>Blog</span>
          <i className="fas fa-chevron-right" />
          <span>{truncate(blog.title, 50)}</span>
        </div>

        {/* Article */}
        <article className={styles.article}>

          {/* Cover image — ẩn hoàn toàn nếu null */}
          {blog.thumbnailUrl && (
            <img
              className={styles.cover}
              src={blog.thumbnailUrl}
              alt={blog.title}
            />
          )}

          <div className={styles.body}>
            {/* Title */}
            <h1 className={styles.title}>{blog.title}</h1>

            {/* Meta */}
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <i className="fas fa-user-edit" />
                Bởi {blog.authorName}
              </span>
              <span className={styles.metaItem}>
                <i className="fas fa-eye" />
                {formatViews(blog.viewCount)} lượt xem
              </span>
              {displayDate && (
                <span className={styles.metaItem}>
                  <i className="fas fa-calendar-alt" />
                  {displayDate}
                </span>
              )}
            </div>

            {/* Content — sanitized HTML */}
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </div>
        </article>

        {/* Related Blogs — ẩn hoàn toàn nếu mảng rỗng */}
        {blog.relatedBlogs.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>
              <i className="fas fa-bookmark" />
              Bài viết liên quan
            </h2>
            <div className={styles.relatedGrid}>
              {blog.relatedBlogs.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={styles.relatedCard}
                  onClick={() => navigate(`/blogs/${item.id}`)}
                >
                  {item.thumbnailUrl ? (
                    <img
                      className={styles.relatedThumb}
                      src={item.thumbnailUrl}
                      alt={item.title}
                    />
                  ) : (
                    <div className={styles.relatedThumbFallback}>
                      <i className="fas fa-image" />
                    </div>
                  )}
                  <div className={styles.relatedInfo}>
                    <p className={styles.relatedCardTitle}>{item.title}</p>
                    {item.publishedAt && (
                      <span className={styles.relatedDate}>
                        <i className="fas fa-calendar-alt" />
                        {formatDate(item.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

/* ── Outer wrapper — đọc useParams, pass key để remount khi id đổi ────────── */
export default function BlogDetail() {
  const { id } = useParams();
  return <BlogDetailInner key={id} id={id} />;
}
