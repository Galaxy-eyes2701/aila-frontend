import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../utils/api';
import styles from './Header.module.css';

const NAV_LINKS = [
  { label: 'Khóa học',              href: '/' },
  { label: 'Thực hành viết prompt', href: '/' },
  { label: 'Hướng dẫn',            href: '/' },
  { label: 'Bài viết',             href: '/' },
];

const DEFAULT_AVATAR = 'https://i.pravatar.cc/80';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);

  // Khi user đăng nhập → gọi API lấy avatar theo role
  useEffect(() => {
    if (!user) {
      setAvatarUrl(DEFAULT_AVATAR);
      return;
    }

    const fetchAvatar = async () => {
      try {
        let url = DEFAULT_AVATAR;

        if (user.role === 'Expert') {
          const res = await api.get('/experts/me/profile');
          if (res.data.success && res.data.data.avatarUrl) {
            url = res.data.data.avatarUrl;
          }
        }
        // Có thể mở rộng thêm Learner, Admin ở đây nếu cần

        setAvatarUrl(url);
      } catch {
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };

    fetchAvatar();
  }, [user]);

  const handleLogout = () => {
    logout();
    setAvatarUrl(DEFAULT_AVATAR);
    navigate('/expert/login');
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
                  <span className={styles.bellBadge}>!</span>
                </button>
                <div className={styles.noticeDropdown}>
                  <div className={styles.noticeDropdownHeader}>🔔 Thông báo mới</div>
                  <div className={styles.noticeDropdownItem}>
                    <strong>Chào mừng trở lại!</strong>
                    Bạn đã đăng nhập thành công.
                  </div>
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
                  <Link to="/expert/profile">
                    <i className="fas fa-user" /> Hồ sơ cá nhân
                  </Link>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" /> Đăng xuất
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/expert/login" className={styles.btnLogin}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}