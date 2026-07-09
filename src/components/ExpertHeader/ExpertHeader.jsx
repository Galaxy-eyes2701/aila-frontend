import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../utils/api';
import styles from './ExpertHeader.module.css';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/80';

// Nav links dành riêng cho Expert
const EXPERT_NAV_LINKS = [
  { label: 'Trang chủ',        href: '/expert'         },
  { label: 'Quản lý khóa học', href: '/expert/courses' },
  { label: 'Tạo Tag',          href: '/expert/tags'    },
];

export default function ExpertHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount]               = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await api.get('/experts/me/profile');
        if (res.data.success && res.data.data.avatarUrl)
          setAvatarUrl(res.data.data.avatarUrl);
      } catch { /* giữ default */ }
    };
    fetch();
  }, [user]);

    useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          const all = res.data.data ?? [];
          setRecentNotifications(all.slice(0, 3));
          setUnreadCount(all.filter(n => !n.isRead).length);
        }
      } catch { }
    };

    fetchNotifications();
      window.addEventListener('notifications-updated', fetchNotifications);
    return () => {
      window.removeEventListener('notifications-updated', fetchNotifications);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/expert/login');
  };

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        {/* Logo */}
        <Link to="/expert" className={styles.logo}>
          Bình Dân <span>Học AI</span>
        </Link>

        {/* Nav links — thêm vào EXPERT_NAV_LINKS khi có yêu cầu */}
        {EXPERT_NAV_LINKS.length > 0 && (
          <ul className={styles.navLinks}>
            {EXPERT_NAV_LINKS.map(({ label, href }) => (
              <li key={label}><Link to={href}>{label}</Link></li>
            ))}
          </ul>
        )}

        <div className={styles.navActions}>
          {/* Bell */}
          <div className={styles.noticeWrapper}>
            <button
              className={styles.bellBtn}
              onClick={() => navigate('/expert/notifications')}
              aria-label="Thông báo"
            >
              <i className="fas fa-bell" />
              {unreadCount > 0 && (
                <span className={styles.bellBadge}>{unreadCount}</span>
              )}
            </button>

            <div className={styles.noticeDropdown}>
              <div className={styles.noticeDropdownHeader}>🔔 Thông báo mới</div>

              {recentNotifications.length === 0 ? (
                <div className={styles.noticeDropdownItem}>
                  Chưa có thông báo nào.
                </div>
              ) : (
                recentNotifications.map(n => (
                  <div key={n.id} className={styles.noticeDropdownItem}>
                    <strong>{n.title}</strong>
                    {n.body}
                  </div>
                ))
              )}

              <Link to="/expert/notifications" className={styles.noticeDropdownFooter}>
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>

          {/* Avatar */}
          <div className={styles.userMenu}>
            <img
              className={styles.avatar}
              src={avatarUrl}
              alt="Avatar"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className={styles.userDropdown}>
              <Link to="/expert/profile">
                <i className="fas fa-user" /> Hồ sơ cá nhân
              </Link>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}