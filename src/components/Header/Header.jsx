import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../utils/api';
import styles from './Header.module.css';

const NAV_LINKS = [
  { label: 'Khóa học',              href: '/courses' },
  { label: 'Hướng dẫn',            href: '*' },
  { label: 'Bài viết',             href: '/blogs' },
];

const DEFAULT_AVATAR = 'https://i.pravatar.cc/80';

export default function Header({ onLoginClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Khi user đăng nhập → gọi API lấy avatar theo role
  useEffect(() => {
    if (!user) {
      setAvatarUrl(DEFAULT_AVATAR);
      return;
    }

    const fetchAvatar = async () => {
      try {
        let url = DEFAULT_AVATAR;

        if (user.role === 'Learner') {
          const res = await api.get('/profile/learner/me');
          if (res.data.success && res.data.data.avatarUrl) {
            url = res.data.data.avatarUrl;
          }
        }

        setAvatarUrl(url);
      } catch {
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };

    fetchAvatar();
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
    }, [user]);

  const handleLogout = () => {
    logout();
    setAvatarUrl(DEFAULT_AVATAR);
    navigate('/');
  };

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        <Link to="/" className={styles.logo}>
          Bình Dân <span>Học AI</span>
        </Link>

        <ul className={styles.navLinks}>
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link to={href}>{label}</Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          {user ? (
            <>
              {/* Bell */}
              <div className={styles.noticeWrapper}>
                <button
                  className={styles.bellBtn}
                  onClick={() => navigate('/notifications')}
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

                  <Link to="/notifications" className={styles.noticeDropdownFooter}>
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>

              {/* Avatar dropdown */}
              <div className={styles.userMenu}>
                <img
                  className={styles.avatar}
                  src={avatarUrl}
                  alt="Avatar"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }} // fallback nếu ảnh lỗi
                />
                <div className={styles.userDropdown}>
                  <Link to="/profile">
                    <i className="fas fa-user" /> Hồ sơ cá nhân
                  </Link>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button className={styles.btnLogin} onClick={onLoginClick}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}