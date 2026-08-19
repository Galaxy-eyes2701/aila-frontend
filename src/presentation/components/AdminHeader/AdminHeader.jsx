import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect, useRef } from "react";
import useAuth from "@state/hooks/useAuth";
import api from "@services/api";
import styles from "./AdminHeader.module.css";

const NAV_ITEMS = [
  { label: "Báo cáo", href: "/admin/reports", icon: "fas fa-chart-pie" },
  { label: "Người dùng", href: "/admin/users", icon: "fas fa-users" },
  { label: "Gói đăng ký", href: "/admin/subscription-plans", icon: "fas fa-crown" },
  {
    key: "content",
    label: "Nội dung",
    icon: "fas fa-newspaper",
    children: [
      { label: "Bài viết", href: "/admin/blogs", icon: "fas fa-file-alt" },
      { label: "Danh mục", href: "/admin/categories", icon: "fas fa-folder-open" },
      { label: "Tags", href: "/admin/tags", icon: "fas fa-tags" },
    ],
  },
  {
    key: "ai",
    label: "Hệ thống AI",
    icon: "fas fa-brain",
    children: [
      { label: "Tiêu thụ & Đơn giá AI", href: "/admin/ai-reports", icon: "fas fa-chart-bar" },
      { label: "Quản lý tài nguyên", href: "/admin/resource-limit-management", icon: "fas fa-cubes" },
    ],
  },
  {
    key: "monitoring",
    label: "Giám sát",
    icon: "fas fa-shield-alt",
    children: [
      { label: "Vi phạm chính sách", href: "/admin/policy-violations", icon: "fas fa-exclamation-triangle" },
      { label: "Nhật kí hoạt động", href: "/admin/activity-logs", icon: "fas fa-history" },
    ],
  },
];

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const noticeRef = useRef(null);
  const navRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/admin/login");
  }, [logout, navigate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (noticeRef.current && !noticeRef.current.contains(e.target)) {
        setNoticeOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
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
      } catch { }
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
      } catch { }
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
    if (!href) return false;
    return (
      location.pathname === href ||
      (href !== "/admin" && location.pathname.startsWith(href))
    );
  };

  const isGroupActive = (item) => {
    if (item.href) return isLinkActive(item.href);
    if (item.children) {
      return item.children.some((child) => isLinkActive(child.href));
    }
    return false;
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navContent}>
        <Link to="/admin/reports" className={styles.logo}>
          Bình Dân <span>Học AI</span>
          <span className={styles.adminBadge}>ADMIN</span>
        </Link>

        <nav
          ref={navRef}
          className={`${styles.navLinksWrapper} ${mobileOpen ? styles.navLinksOpen : ""}`}
        >
          <ul className={styles.navLinks}>
            {NAV_ITEMS.map((item) => {
              if (!item.children) {
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={isLinkActive(item.href) ? styles.active : ""}
                      onClick={() => setMobileOpen(false)}
                    >
                      <i className={`${item.icon} ${styles.linkIcon}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              }

              const groupActive = isGroupActive(item);
              const isOpen = openDropdown === item.key;

              return (
                <li
                  key={item.key}
                  className={styles.dropdownLi}
                  onMouseEnter={() => setOpenDropdown(item.key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    className={`${styles.dropdownToggle} ${groupActive ? styles.active : ""}`}
                    onClick={() => setOpenDropdown((prev) => (prev === item.key ? null : item.key))}
                  >
                    <i className={`${item.icon} ${styles.linkIcon}`} />
                    <span>{item.label}</span>
                    <i className={`fas fa-chevron-down ${styles.caretIcon} ${isOpen ? styles.caretRotate : ""}`} />
                  </button>

                  <div className={`${styles.dropdownMenu} ${isOpen ? styles.dropdownMenuShow : ""}`}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`${styles.dropdownMenuItem} ${isLinkActive(child.href) ? styles.activeSubItem : ""}`}
                        onClick={() => {
                          setOpenDropdown(null);
                          setMobileOpen(false);
                        }}
                      >
                        <i className={`${child.icon} ${styles.childIcon}`} />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

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
                <i className="fas fa-bell" /> Thông báo mới
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
            <i className="fas fa-sign-out-alt" />
            <span>Đăng xuất</span>
          </button>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Mở menu"
          >
            <i className={`fas ${mobileOpen ? "fa-times" : "fa-bars"}`} />
          </button>
        </div>
      </div>
    </header>
  );
}



