import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./UserManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import CreateExpertModal from "./CreateExpertModal";
import { getUsers, updateUserStatus } from "../services/userApi";

const ROLE_LABEL = {
  Admin: { text: "Admin", cls: "roleAdmin" },
  Expert: { text: "Expert", cls: "roleExpert" },
  Learner: { text: "Learner", cls: "roleLearner" },
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [busyUserId, setBusyUserId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const res = await getUsers({
        searchKeyword: searchKeyword.trim() || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
      });

      if (res.success) {
        setUsers(res.data ?? []);
      } else {
        setPageError(
          res.errorMessage || "Không thể tải danh sách người dùng.",
        );
      }
    } catch (err) {
      setPageError(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
      );
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearchKeyword(searchInput);
  }

  async function handleToggleStatus(user) {
    const nextActive = !user.isActive;
    const confirmMessage = nextActive
      ? `Kích hoạt lại tài khoản "${user.fullName}"?`
      : `Vô hiệu hóa tài khoản "${user.fullName}"? Người dùng sẽ không thể đăng nhập.`;

    if (!window.confirm(confirmMessage)) return;

    setBusyUserId(user.id);

    try {
      const res = await updateUserStatus(user.id, nextActive);

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, isActive: nextActive } : u,
          ),
        );
        showToast(
          nextActive ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.",
        );
      } else {
        showToast(
          res.errorMessage || "Không thể cập nhật trạng thái.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý người dùng</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý người dùng</h1>
            <p className={styles.headerText}>
              Xem, tìm kiếm, thay đổi trạng thái tài khoản và tạo tài khoản
              Expert mới cho hệ thống.
            </p>
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => setCreateModalOpen(true)}
          >
            <i className="fas fa-user-plus" />
            Tạo tài khoản Expert
          </button>
        </section>

        <div className={styles.filterBar}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
            />
            <button type="submit" className={styles.secondaryButton}>
              <i className="fas fa-search" />
            </button>
          </form>

          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Learner">Learner</option>
            <option value="Expert">Expert</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã vô hiệu hóa</option>
          </select>

          <button
            className={styles.secondaryButton}
            onClick={fetchUsers}
            disabled={loading}
          >
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr className={styles.loadingRow}>
                  <td colSpan={5}>Đang tải danh sách người dùng...</td>
                </tr>
              )}

              {!loading && pageError && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button
                        className={styles.secondaryButton}
                        onClick={fetchUsers}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-users-slash" />
                      <p>Không tìm thấy người dùng nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !pageError &&
                users.map((user) => {
                  const roleInfo = ROLE_LABEL[user.role] ?? {
                    text: user.role,
                    cls: "roleLearner",
                  };

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <span>{user.fullName}</span>
                          <span className={styles.userEmail}>
                            {user.email}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${styles[roleInfo.cls]}`}
                        >
                          {roleInfo.text}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${
                            user.isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {user.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                        </span>
                      </td>

                      <td>{formatDate(user.createdAt)}</td>

                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={`${styles.toggleButton} ${
                              user.isActive
                                ? styles.toggleButtonDeactivate
                                : styles.toggleButtonActivate
                            }`}
                            disabled={busyUserId === user.id}
                            onClick={() => handleToggleStatus(user)}
                          >
                            <i
                              className={`fas ${
                                user.isActive ? "fa-ban" : "fa-check"
                              }`}
                            />
                            {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateExpertModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          setCreateModalOpen(false);
          fetchUsers();
          showToast("Đã tạo tài khoản Expert mới.");
        }}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}