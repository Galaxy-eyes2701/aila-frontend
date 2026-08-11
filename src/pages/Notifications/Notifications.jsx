import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Notifications.module.css';
import Pagination from '../../components/Pagination/Pagination.jsx';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getTypeClass(type = '') {
  const t = type.toLowerCase();
  if (t.includes('course'))    return 'courseUpdate';
  if (t.includes('enrollment'))return 'enrollment';
  if (t.includes('assignment') || t.includes('feedback')) return 'assignment';
  return 'system';
}

function getTypeIcon(type = '') {
  const t = type.toLowerCase();
  if (t.includes('course'))    return 'fa-book-open';
  if (t.includes('enrollment'))return 'fa-user-check';
  if (t.includes('assignment') || t.includes('feedback')) return 'fa-comment-dots';
  return 'fa-bell';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonCircle} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('all'); // 'all' | 'unread'

    // ── Phân trang ──
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
        } else {
          setError('Không thể tải thông báo. Vui lòng thử lại.');
        }
      } catch {
        setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

    const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.patch('/notifications/read-all');
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch { }
  };

  const handleNotificationClick = async (n) => {
    if (!n) return;

    if (!n.isRead) {
      setNotifications(prev =>
        prev.map(item => item.id === n.id ? { ...item, isRead: true } : item)
      );
      try {
        await api.patch(`/notifications/${n.id}/read`);
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch { }
    }

    const targetUrl = n.redirectUrl || n.redicturl || n.redirect_url || n.targetUrl;
    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.location.href = targetUrl;
      } else {
        const formattedUrl = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
        navigate(formattedUrl);
      }
    }
  };

    // Lọc theo filter
    const filtered =
      filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    // Reset trang khi đổi filter
    useEffect(() => {
      setCurrentPage(1);
    }, [filter, itemsPerPage]);

    // Tính phân trang
    const totalItems = filtered.length;
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / itemsPerPage)
    );

    const startIndex = (currentPage - 1) * itemsPerPage;

    const displayed = filtered.slice(
      startIndex,
      startIndex + itemsPerPage
    );

const unreadCount = notifications.filter(
  (n) => !n.isRead
).length;

   return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
          <i className="fas fa-chevron-right" />
          <span>Thông báo</span>
        </div>

        <h1 className={styles.pageTitle}>
          Tất cả thông báo
          {unreadCount > 0 && (
            <span className={styles.titleBadge}>{unreadCount} mới</span>
          )}
        </h1>

        <div className={styles.card}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
                onClick={() => setFilter('unread')}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                <i className="fas fa-check-double" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && <SkeletonLoader />}

          {/* Error */}
          {!loading && error && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className="fas fa-wifi" /></div>
              <p className={styles.emptyTitle}>Không thể tải thông báo</p>
              <p className={styles.emptyDesc}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className="fas fa-bell-slash" /></div>
              <p className={styles.emptyTitle}>
                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </p>
              <p className={styles.emptyDesc}>
                {filter === 'unread'
                  ? 'Bạn đã đọc tất cả thông báo rồi!'
                  : 'Các thông báo mới sẽ xuất hiện tại đây.'}
              </p>
            </div>
          )}

          {/* List — chỉ render trang hiện tại */}
          {!loading && !error && displayed.length > 0 && (
            <ul className={styles.list}>
              {displayed.map((n) => {
                const typeClass = getTypeClass(n.type);
                return (
                  <li
                    key={n.id}
                    className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`${styles.typeIcon} ${styles[typeClass]}`}>
                      <i className={`fas ${getTypeIcon(n.type)}`} />
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemBody}>{n.body}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemTime}>
                          <i className="fas fa-clock" />
                          {formatTime(n.createdAt)}
                        </span>
                        <span className={`${styles.typePill} ${styles[typeClass]}`}>
                          {n.type}
                        </span>
                      </div>
                    </div>
                    {!n.isRead && <div className={styles.unreadDot} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Phân trang — luôn hiển thị khi có dữ liệu, kể cả 1 trang */}
        {!loading && !error && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
}
