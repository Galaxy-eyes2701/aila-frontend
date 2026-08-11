import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";
import styles from "./Header.module.css";
import { DEFAULT_AVATAR } from "../../constants/defaultAvatar";

const NAV_LINKS = [
  { label: "Khóa học", href: "/courses" },
  { label: "Hướng dẫn", href: "*" },
  { label: "Tin tức", href: "/blogs" },
  { label: "Gói đăng ký", href: "/subscription-plans" },
  { label: "Hỏi đáp", href: "*" },
];

export default function Header({ onLoginClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const noticeRef = useRef(null);
  const userMenuRef = useRef(null);

  const isLinkActive = (href) => {
    if (href === "*") return false;
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

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
        } else if (user.role === "Expert") {
          const res = await api.get("/experts/me/profile");
          if (res.data.success && res.data.data.avatarUrl) {
            url = res.data.data.avatarUrl;
          }
        }

        setAvatarUrl(url || DEFAULT_AVATAR);
      } catch {
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };

    fetchAvatar();

    window.addEventListener("profile-updated", fetchAvatar);
    return () => {
      window.removeEventListener("profile-updated", fetchAvatar);
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

  const handleNotificationClick = async (n) => {
    setNoticeOpen(false);
    if (!n) return;

    if (!n.isRead) {
      setRecentNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await api.patch(`/notifications/${n.id}/read`);
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch {}
    }

    const targetUrl = n.redirectUrl || n.redicturl || n.redirect_url || n.targetUrl;
    if (targetUrl) {
      if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
        window.location.href = targetUrl;
      } else {
        const formattedUrl = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
        navigate(formattedUrl);
      }
    } else {
      navigate("/notifications");
    }
  };

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
              <Link
                to={href}
                className={isLinkActive(href) ? styles.active : ""}
                onClick={() => setMobileOpen(false)}
              >
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
                      <div
                        key={n.id}
                        className={styles.noticeDropdownItem}
                        onClick={() => handleNotificationClick(n)}
                        style={{ cursor: "pointer" }}
                      >
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
                  {user.role === "Learner" && (
                    <>
                      <Link to="/profile/subscription" onClick={() => setUserMenuOpen(false)}>
                        <i className="fas fa-gem" /> Gói đăng ký của tôi
                      </Link>
                      <Link to="/profile/payment-history" onClick={() => setUserMenuOpen(false)}>
                        <i className="fas fa-receipt" /> Lịch sử thanh toán
                      </Link>
                      <Link to="/profile/subscription-usage" onClick={() => setUserMenuOpen(false)}>
                        <i className="fas fa-chart-pie" /> Tài nguyên đăng ký
                      </Link>
                    </>
                  )}
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
