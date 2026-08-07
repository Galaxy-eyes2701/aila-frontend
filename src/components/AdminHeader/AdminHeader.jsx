import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import styles from "./AdminHeader.module.css";

const NAV_LINKS = [
  { label: "Bảng điều khiển", href: "/admin/dashboard" },
  { label: "Người dùng", href: "/admin/users" },
  { label: "Tags", href: "/admin/tags" },
  { label: "Báo cáo", href: "/admin/reports" },
  { label: "Danh mục", href: "/admin/categories" },
  { label: "Bài viết", href: "/admin/blogs" },
  { label: "Gói đăng ký", href: "/admin/subscription-plans" },
  { label: "Tài nguyên", href: "/admin/resource-limit-management" },
];

export default function AdminHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/admin/login");
  }, [logout, navigate]);

  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        <Link to="/admin" className={styles.logo}>
          Bình dân <span>Học AI</span>
        </Link>

        <ul
          className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={location.pathname === link.href ? styles.active : ""}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
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
