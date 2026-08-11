import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useAuth from "@state/hooks/useAuth";
import api from "@services/api";
import { getAssignedRequests } from "@services/expertEvaluationApi";
import { REQUEST_STATUS } from "@infrastructure/constants/expertEvaluation";
import styles from "./ExpertHeader.module.css";

import { DEFAULT_AVATAR } from "@infrastructure/constants/defaultAvatar";

// Nav links dành riêng cho Expert
const EXPERT_NAV_LINKS = [
  { label: "Trang chủ", href: "/expert" },
  { label: "Quản lý khóa học", href: "/expert/courses" },
  // `badge: "evaluations"` -> hiện số yêu cầu đang chờ chấm
  {
    label: "Yêu cầu đánh giá",
    href: "/expert/evaluation-requests",
    badge: "evaluations",
  },
  { label: "Tài nguyên AI", href: "/expert/ai-resource-usage" },
];

export default function ExpertHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      navigate("/expert/notifications");
    }
  };

  // Badge "Yêu cầu đánh giá": chỉ cần totalItems nên gọi pageSize=1.
  const [pendingEvaluations, setPendingEvaluations] = useState(0);

  useEffect(() => {
    if (!user) {
      setPendingEvaluations(0);
      return;
    }

    const fetchPendingEvaluations = async () => {
      try {
        const page = await getAssignedRequests({
          status: REQUEST_STATUS.IN_PROGRESS,
          pageIndex: 0,
          pageSize: 1,
        });
        setPendingEvaluations(page?.totalItems ?? 0);
      } catch {
        setPendingEvaluations(0);
      }
    };

    fetchPendingEvaluations();
    window.addEventListener("evaluation-requests-updated", fetchPendingEvaluations);
    return () => {
      window.removeEventListener(
        "evaluation-requests-updated",
        fetchPendingEvaluations,
      );
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/expert/login");
  };

  const isLinkActive = (href) => {
    if (href === "/expert") {
      return location.pathname === "/expert" || location.pathname === "/expert/";
    }
    if (href === "/expert/courses") {
      return (
        location.pathname.startsWith("/expert/courses") ||
        location.pathname.startsWith("/expert/modules")
      );
    }
    if (href === "/expert/evaluation-requests") {
      return (
        location.pathname.startsWith("/expert/evaluation-requests") ||
        location.pathname.startsWith("/expert/evaluation")
      );
    }
    return location.pathname.startsWith(href);
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
            {EXPERT_NAV_LINKS.map(({ label, href, badge }) => (
              <li key={label}>
                <Link
                  to={href}
                  className={isLinkActive(href) ? styles.active : ""}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                  {badge === "evaluations" && pendingEvaluations > 0 && (
                    <span
                      className={styles.navBadge}
                      aria-label={`${pendingEvaluations} yêu cầu đang chờ chấm`}
                    >
                      {pendingEvaluations}
                    </span>
                  )}
                </Link>
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
              <Link to="/expert/ai-resource-usage" onClick={() => setUserMenuOpen(false)}>
                <i className="fas fa-bolt" /> Tài nguyên AI
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
