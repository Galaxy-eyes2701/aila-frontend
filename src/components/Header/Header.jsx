import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { label: "Khóa học", href: "/courses" },
  { label: "Hướng dẫn", href: "*" },
  { label: "Tin tức", href: "/blogs" },
  { label: "Gói đăng ký", href: "/subscription-plans" },
  { label: "Hỏi đáp", href: "*" },
];

const DEFAULT_AVATAR = "https://i.pravatar.cc/80";

export default function Header({ onLoginClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const noticeRef = useRef(null);
  const userMenuRef = useRef(null);

  // Đóng dropdown khi bấm ra ngoài
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
  useEffect(() => {
    if (!user) {
      setAvatarUrl(DEFAULT_AVATAR);
      return;
    }

    const fetchAvatar = async () => {
      try {
        let url = DEFAULT_AVATAR;

        if (user.role === "Learner") {
          const res = await api.get("/profile/learner/me");
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
    setAvatarUrl(DEFAULT_AVATAR);
    navigate("/");
  };

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        <Link to="/" className={styles.logo}>
          Bình Dân <span>Học AI</span>
        </Link>

        <ul
          className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ""}`}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link to={href} onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          {user ? (
            <>
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
                <div
                  className={`${styles.noticeDropdown} ${noticeOpen ? styles.dropdownOpen : ""}`}
                >
                  <div className={styles.noticeDropdownHeader}>
                    🔔 Thông báo mới
                  </div>

                  {recentNotifications.length === 0 ? (
                    <div className={styles.noticeDropdownItem}>
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div key={n.id} className={styles.noticeDropdownItem}>
                        <strong>{n.title}</strong>
                        {n.body}
                      </div>
                    ))
                  )}

                  <Link
                    to="/notifications"
                    className={styles.noticeDropdownFooter}
                    onClick={() => setNoticeOpen(false)}
                  >
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>

              {/* Avatar dropdown */}
              <div className={styles.userMenu} ref={userMenuRef}>
                <img
                  className={styles.avatar}
                  src={avatarUrl}
                  alt="Avatar"
                  onClick={() => {
                    setUserMenuOpen((o) => !o);
                    setNoticeOpen(false);
                  }}
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <div
                  className={`${styles.userDropdown} ${userMenuOpen ? styles.dropdownOpen : ""}`}
                >
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                    <i className="fas fa-user" /> Hồ sơ cá nhân
                  </Link>
                  <button
                    className={styles.logoutBtn}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
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
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Mở menu"
        >
          <i className={`fas ${mobileOpen ? "fa-times" : "fa-bars"}`} />
        </button>
      </div>
    </header>
  );
}
