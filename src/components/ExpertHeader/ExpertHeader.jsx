import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";
import styles from "./ExpertHeader.module.css";

import { DEFAULT_AVATAR } from "../../constants/defaultAvatar";

// Nav links dành riêng cho Expert
const EXPERT_NAV_LINKS = [
  { label: "Trang chủ", href: "/expert" },
  { label: "Quản lý khóa học", href: "/expert/courses" },
];

export default function ExpertHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const noticeRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (noticeRef.current && !noticeRef.current.contains(e.target)) {
        setNoticeOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await api.get("/experts/me/profile");
        if (res.data.success && res.data.data.avatarUrl) {
          setAvatarUrl(res.data.data.avatarUrl);
        } else {
          setAvatarUrl(DEFAULT_AVATAR);
        }
      } catch {
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };
    fetch();

    window.addEventListener("profile-updated", fetch);
    return () => {
      window.removeEventListener("profile-updated", fetch);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (res.data.success) {
          const all = res.data.data ?? [];
          setRecentNotifications(all.slice(0, 3));
          setUnreadCount(all.filter((n) => !n.isRead).length);
        }
      } catch {}
    };

    fetchNotifications();
    window.addEventListener("notifications-updated", fetchNotifications);
    return () => {
      window.removeEventListener("notifications-updated", fetchNotifications);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/expert/login");
  };

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        {/* Logo */}
        <Link to="/expert" className={styles.logo}>
          Bình Dân <span>Học AI</span>
        </Link>

        {/* Nav links */}
        {EXPERT_NAV_LINKS.length > 0 && (
          <ul className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ''}`}>
            {EXPERT_NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <Link to={href} onClick={() => setMobileOpen(false)}>{label}</Link>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.navActions}>
          {/* Bell */}
          <div className={styles.noticeWrapper} ref={noticeRef}>
            <button
              className={styles.bellBtn}
              onClick={() => {
                setNoticeOpen((o) => !o);
                setUserMenuOpen(false);
              }}
              aria-label="Thông báo"
            >
              <i className="fas fa-bell" />
              {unreadCount > 0 && (
                <span className={styles.bellBadge}>{unreadCount}</span>
              )}
            </button>

            <div className={`${styles.noticeDropdown} ${noticeOpen ? styles.dropdownOpen : ''}`}>
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

              <Link
                to="/expert/notifications"
                className={styles.noticeDropdownFooter}
                onClick={() => setNoticeOpen(false)}
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>

          {/* Avatar */}
          <div className={styles.userMenu} ref={userMenuRef}>
            <img
              className={styles.avatar}
              src={avatarUrl}
              alt="Avatar"
              onClick={() => {
                setUserMenuOpen((o) => !o);
                setNoticeOpen(false);
              }}
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className={`${styles.userDropdown} ${userMenuOpen ? styles.dropdownOpen : ''}`}>
              <Link to="/expert/profile" onClick={() => setUserMenuOpen(false)}>
                <i className="fas fa-user" /> Hồ sơ cá nhân
              </Link>
              <button
                className={styles.logoutBtn}
                onClick={() => { setUserMenuOpen(false); handleLogout(); }}
              >
                <i className="fas fa-sign-out-alt" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Mở menu"
        >
          <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>
    </header>
  );
}
