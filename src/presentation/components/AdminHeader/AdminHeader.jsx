import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect, useRef } from "react";
import useAuth from "@state/hooks/useAuth";
import api from "@services/api";
import styles from "./AdminHeader.module.css";

const NAV_LINKS = [
  { label: "Báo cáo", href: "/admin/reports" },
  { label: "Người dùng", href: "/admin/users" },
  { label: "Tags", href: "/admin/tags" },
  { label: "Danh mục", href: "/admin/categories" },
  { label: "Bài viết", href: "/admin/blogs" },
  { label: "Gói đăng ký", href: "/admin/subscription-plans" },
  { label: "Tài nguyên", href: "/admin/resource-limit-management" },
  { label: "Nhật kí", href: "/admin/activity-logs" },
];

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const noticeRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/admin/login");
  }, [logout, navigate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (noticeRef.current && !noticeRef.current.contains(e.target)) {
        setNoticeOpen(false);
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
      navigate("/admin/notifications");
    }
  };

  const isLinkActive = (href) => {
    return (
      location.pathname === href ||
      (href !== "/admin" && location.pathname.startsWith(href))
    );
  };

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        <Link to="/admin/reports" className={styles.logo}>
          Bình dân <span>Học AI</span>
        </Link>

        <ul
          className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={isLinkActive(link.href) ? styles.active : ""}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          {/* Notification Bell */}
          <div className={styles.noticeWrapper} ref={noticeRef}>
            <button
              className={styles.bellBtn}
              onClick={() => setNoticeOpen((o) => !o)}
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
                to="/admin/notifications"
                className={styles.noticeDropdownFooter}
                onClick={() => setNoticeOpen(false)}
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>

          <button className={styles.logoutButton} onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Đăng xuất
          </button>
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

