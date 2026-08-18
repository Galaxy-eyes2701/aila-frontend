import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./UserManagement.module.css";
import Toast from "../../Expert/ModuleManagement/components/Toast";
import CreateExpertModal from "./CreateExpertModal";
import ConfirmModal from "@presentation/components/ConfirmModal/ConfirmModal";
import Pagination from "@presentation/components/Pagination/Pagination";
import { getUsers, updateUserStatus } from "@services/userApi";
import { resolveApiError } from "@services/api";

const ROLE_LABEL = {
  Admin: { text: "Quản trị viên", cls: "roleAdmin" },
  Expert: { text: "Chuyên gia", cls: "roleExpert" },
  Learner: { text: "Học viên", cls: "roleLearner" },
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
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
        setPageError(res.errorMessage || "Không thể tải danh sách người dùng.");
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setPageError(errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, roleFilter, statusFilter]);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage, itemsPerPage]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearchKeyword(searchInput);
  }

  function handleToggleStatus(user) {
    const nextActive = !user.isActive;
    setConfirmModal({
      user,
      nextActive,
      title: nextActive ? "Kích hoạt lại tài khoản?" : "Vô hiệu hóa tài khoản?",
      description: nextActive
        ? `Bạn có chắc muốn kích hoạt lại tài khoản "${user.fullName}" (${user.email})?`
        : `Bạn có chắc muốn vô hiệu hóa tài khoản "${user.fullName}" (${user.email})? Người dùng sẽ không thể đăng nhập vào hệ thống.`,
      tone: nextActive ? "primary" : "danger",
      confirmLabel: nextActive ? "Kích hoạt" : "Vô hiệu hóa",
      icon: nextActive ? "fa-user-check" : "fa-user-slash",
    });
  }

  async function executeToggleStatus() {
    if (!confirmModal) return;
    const { user, nextActive } = confirmModal;

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
      const { errorMessage } = resolveApiError(err);
      showToast(errorMessage || "Lỗi kết nối máy chủ.", "error");
    } finally {
      setBusyUserId("");
      setConfirmModal(null);
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
              Chuyên gia mới cho hệ thống.
            </p>
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => setCreateModalOpen(true)}
          >
            <i className="fas fa-user-plus" />
            Tạo tài khoản Chuyên gia
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
            <option value="Learner">Học viên</option>
            <option value="Expert">Chuyên gia</option>
            <option value="Admin">Quản trị viên</option>
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
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={styles.loadingRow}>
                    <td colSpan={5}>
                      <div className={styles.skeletonRow}>
                        <div
                          className={`${styles.skeletonLine} ${styles.wide}`}
                        />
                        <div
                          className={`${styles.skeletonLine} ${styles.narrow}`}
                        />
                        <div
                          className={`${styles.skeletonLine} ${styles.narrow}`}
                        />
                        <div
                          className={`${styles.skeletonLine} ${styles.narrow}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

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
                paginatedUsers.map((user) => {
                  const roleInfo = ROLE_LABEL[user.role] ?? {
                    text: user.role,
                    cls: "roleLearner",
                  };

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <span>{user.fullName}</span>
                          <span className={styles.userEmail}>{user.email}</span>
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
        {!loading && !pageError && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(users.length / itemsPerPage))}
            itemsPerPage={itemsPerPage}
            totalItems={users.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
            unitLabel="người dùng"
          />
        )}
      </div>

      <CreateExpertModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          setCreateModalOpen(false);
          fetchUsers();
          showToast("Đã tạo tài khoản Chuyên gia mới.");
        }}
      />

      {confirmModal && (
        <ConfirmModal
          open={!!confirmModal}
          title={confirmModal.title}
          description={confirmModal.description}
          tone={confirmModal.tone}
          icon={confirmModal.icon}
          confirmLabel={confirmModal.confirmLabel}
          busy={busyUserId === confirmModal.user.id}
          onConfirm={executeToggleStatus}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
