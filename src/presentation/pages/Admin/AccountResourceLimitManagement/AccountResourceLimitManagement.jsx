import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./AccountResourceLimitManagement.module.css";

import {
  getDefaultResourceLimitPolicies,
  updateDefaultResourceLimitPolicies,
  getOverrideEligibleAccounts,
} from "@services/resourceLimitApi";

import CreateOverrideModal from "./CreateOverrideModal";
import OverrideDetailModal from "./OverrideDetailModal";
import EditOverrideModal from "./EditOverrideModal";

const ACCOUNT_TYPE_LABELS = {
  Learner: { label: "Học viên", cls: styles.roleLearner, icon: "fa-user" },
  Expert: { label: "Chuyên gia", cls: styles.roleExpert, icon: "fa-user-tie" },
  Admin: { label: "Quản trị viên", cls: styles.roleAdmin, icon: "fa-user-shield" },
};

export default function AccountResourceLimitManagement() {
  const [loading, setLoading] = useState(false);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedOverride, setSelectedOverride] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [policies, setPolicies] = useState([]);
  const [accountPage, setAccountPage] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'policies' | 'accounts'

  function clearMessage() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function loadPolicies() {
    try {
      setLoading(true);
      clearMessage();
      const response = await getDefaultResourceLimitPolicies();

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Không thể tải chính sách tài nguyên",
        );
        return;
      }
      setPolicies(response.data ?? []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi tải chính sách",
      );
    } finally {
      setLoading(false);
    }
  }

  function updatePolicyValue(index, field, value) {
    const clone = [...policies];
    clone[index] = {
      ...clone[index],
      [field]: Math.max(0, Number(value) || 0),
    };
    setPolicies(clone);
  }

  async function savePolicies() {
    try {
      setSavingPolicies(true);
      clearMessage();

      const response = await updateDefaultResourceLimitPolicies(policies);

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Cập nhật chính sách thất bại",
        );
        return;
      }

      setSuccessMessage("Cập nhật chính sách mặc định thành công!");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi cập nhật chính sách",
      );
    } finally {
      setSavingPolicies(false);
    }
  }

  async function loadAccounts() {
    try {
      setLoading(true);
      clearMessage();

      const response = await getOverrideEligibleAccounts({
        keyword: searchKeyword,
        pageIndex,
        pageSize,
      });

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Không thể tải danh sách tài khoản",
        );
        return;
      }

      setAccountPage(response.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi tải danh sách tài khoản",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [pageIndex, searchKeyword]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPageIndex(0);
    setSearchKeyword(keyword.trim());
  }

  function handleRefreshAll() {
    loadPolicies();
    loadAccounts();
  }

  function handleManageAccount(account) {
    setSelectedAccount(account);

    if (account.hasOverride) {
      setShowDetailModal(true);
    } else {
      setShowCreateModal(true);
    }
  }

  // Calculate summary metrics
  const overrideCount = useMemo(() => {
    return accountPage?.items?.filter((acc) => acc.hasOverride).length ?? 0;
  }, [accountPage]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" aria-hidden="true" />
          <span>Quản lý giới hạn tài nguyên</span>
        </div>

        {/* Header Band */}
        <div className={styles.headerBand}>
          <div>
            <div className={styles.headerTitleWrapper}>
              <div className={styles.headerIcon}>
                <i className="fas fa-sliders-h" />
              </div>
              <h1>Quản lý giới hạn tài nguyên</h1>
            </div>
            <p className={styles.headerText}>
              Thiết lập định mức sử dụng AI & Chuyên gia mặc định theo từng nhóm tài khoản và cấu hình ghi đè linh hoạt cho các cá nhân.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleRefreshAll}
              disabled={loading}
            >
              <i className={`fas fa-rotate-right ${loading ? "fa-spin" : ""}`} /> Tải lại dữ liệu
            </button>
          </div>
        </div>

        {/* Alert Notifications */}
        {errorMessage && (
          <div className={`${styles.alert} ${styles.errorAlert}`}>
            <div className={styles.alertContent}>
              <i className={`fas fa-circle-exclamation ${styles.alertIcon}`} />
              <span>{errorMessage}</span>
            </div>
            <button className={styles.closeAlertBtn} onClick={() => setErrorMessage("")}>
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className={`${styles.alert} ${styles.successAlert}`}>
            <div className={styles.alertContent}>
              <i className={`fas fa-circle-check ${styles.alertIcon}`} />
              <span>{successMessage}</span>
            </div>
            <button className={styles.closeAlertBtn} onClick={() => setSuccessMessage("")}>
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        {/* Overview Stats */}
        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
              <i className="fas fa-layer-group" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Chính sách mặc định</span>
              <strong className={styles.statValue}>{policies.length} nhóm</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconEmerald}`}>
              <i className="fas fa-user-gear" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Tài khoản ghi đè</span>
              <strong className={styles.statValue}>{overrideCount} tài khoản</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.iconPurple}`}>
              <i className="fas fa-users" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Tổng số tài khoản quản lý</span>
              <strong className={styles.statValue}>{accountPage?.totalItems ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <i className="fas fa-border-all" /> Tất cả cấu hình
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "policies" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("policies")}
          >
            <i className="fas fa-sliders-h" /> Chính sách mặc định
            <span className={styles.tabCountBadge}>{policies.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "accounts" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("accounts")}
          >
            <i className="fas fa-user-shield" /> Ghi đè theo tài khoản
            <span className={styles.tabCountBadge}>{accountPage?.totalItems ?? 0}</span>
          </button>
        </div>

        {/* Section 1: Default Policy */}
        {(activeTab === "all" || activeTab === "policies") && (
          <section className={styles.cardSection}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderMain}>
                <div className={styles.cardHeaderIcon}>
                  <i className="fas fa-sliders-h" />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Cấu hình tài nguyên mặc định</h2>
                  <p className={styles.cardSubtitle}>
                    Thiết lập định mức giới hạn tài nguyên mặc định cho từng loại tài khoản trong hệ thống.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={savePolicies}
                disabled={savingPolicies || loading}
                className={styles.primaryButton}
              >
                {savingPolicies ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-floppy-disk" /> Lưu chính sách
                  </>
                )}
              </button>
            </div>

            <div className={styles.cardBody}>
              <PolicyTable policies={policies} onChange={updatePolicyValue} />
            </div>
          </section>
        )}

        {/* Section 2: Account Overrides */}
        {(activeTab === "all" || activeTab === "accounts") && (
          <section className={styles.cardSection}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderMain}>
                <div className={styles.cardHeaderIcon}>
                  <i className="fas fa-user-gear" />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Ghi đè cấu hình tài nguyên tài khoản</h2>
                  <p className={styles.cardSubtitle}>
                    Tìm kiếm tài khoản và thiết lập định mức sử dụng tài nguyên riêng lẻ vượt qua cấu hình mặc định.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <AccountTable
                page={accountPage}
                keyword={keyword}
                setKeyword={setKeyword}
                onSearch={handleSearchSubmit}
                pageIndex={pageIndex}
                setPageIndex={setPageIndex}
                onManage={handleManageAccount}
                loading={loading}
              />
            </div>
          </section>
        )}

        {/* Modals */}
        {showCreateModal && selectedAccount && (
          <CreateOverrideModal
            account={selectedAccount}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              setSelectedAccount(null);
              loadAccounts();
              setSuccessMessage("Tạo cấu hình tài nguyên riêng thành công!");
            }}
          />
        )}

        {showDetailModal && selectedAccount && (
          <OverrideDetailModal
            account={selectedAccount}
            onClose={() => setShowDetailModal(false)}
            onEdit={(data) => {
              setSelectedOverride(data);
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onSuccess={() => {
              setShowDetailModal(false);
              setSelectedAccount(null);
              loadAccounts();
              setSuccessMessage("Xóa cấu hình tài nguyên riêng thành công!");
            }}
          />
        )}

        {showEditModal && selectedAccount && selectedOverride && (
          <EditOverrideModal
            account={selectedAccount}
            data={selectedOverride}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedAccount(null);
              setSelectedOverride(null);
              loadAccounts();
              setSuccessMessage("Cập nhật cấu hình tài nguyên thành công!");
            }}
          />
        )}
      </div>
    </div>
  );
}

function PolicyTable({ policies, onChange }) {
  if (!policies || policies.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className={`fas fa-inbox ${styles.emptyIcon}`} />
        <p>Chưa có chính sách tài nguyên nào.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <i className="fas fa-users-gear" /> Loại tài khoản
            </th>
            <th>
              <i className="fas fa-microchip" /> Token AI (Hàng tháng)
            </th>
            <th>
              <i className="fas fa-robot" /> Lượt thực hành AI
            </th>
            <th>
              <i className="fas fa-user-tie" /> Yêu cầu đánh giá chuyên gia
            </th>
          </tr>
        </thead>
        <tbody>
          {policies.map((item, index) => {
            const roleConfig = ACCOUNT_TYPE_LABELS[item.accountType] || {
              label: item.accountType,
              cls: styles.roleLearner,
              icon: "fa-user",
            };

            return (
              <tr key={item.accountType}>
                <td>
                  <span className={`${styles.roleBadge} ${roleConfig.cls}`}>
                    <i className={`fas ${roleConfig.icon}`} /> {roleConfig.label}
                  </span>
                </td>
                <td>
                  <div className={styles.numberInputWrapper}>
                    <input
                      type="number"
                      min="0"
                      value={item.aiTokenLimit}
                      onChange={(e) =>
                        onChange(index, "aiTokenLimit", e.target.value)
                      }
                      className={styles.numberInput}
                    />
                    <span className={styles.inputUnit}>Token</span>
                  </div>
                </td>
                <td>
                  <div className={styles.numberInputWrapper}>
                    <input
                      type="number"
                      min="0"
                      value={item.aiPracticeScenarioLimit}
                      onChange={(e) =>
                        onChange(
                          index,
                          "aiPracticeScenarioLimit",
                          e.target.value,
                        )
                      }
                      className={styles.numberInput}
                    />
                    <span className={styles.inputUnit}>Lượt</span>
                  </div>
                </td>
                <td>
                  <div className={styles.numberInputWrapper}>
                    <input
                      type="number"
                      min="0"
                      value={item.expertEvaluationRequestLimit}
                      onChange={(e) =>
                        onChange(
                          index,
                          "expertEvaluationRequestLimit",
                          e.target.value,
                        )
                      }
                      className={styles.numberInput}
                    />
                    <span className={styles.inputUnit}>Yêu cầu</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AccountTable({
  page,
  keyword,
  setKeyword,
  onSearch,
  pageIndex,
  setPageIndex,
  onManage,
  loading,
}) {
  return (
    <div>
      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <form onSubmit={onSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <i className="fas fa-search" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm theo email, họ tên tài khoản..."
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.primaryButton}>
            <i className="fas fa-magnifying-glass" /> Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <i className="fas fa-id-card" /> Tài khoản người dùng
              </th>
              <th>
                <i className="fas fa-user-tag" /> Vai trò
              </th>
              <th>
                <i className="fas fa-sliders" /> Trạng thái cấu hình
              </th>
              <th style={{ textAlign: "right" }}>
                <i className="fas fa-ellipsis" /> Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (!page?.items || page.items.length === 0) ? (
              <tr>
                <td colSpan={4}>
                  <div className={styles.loadingContainer}>
                    <i className={`fas fa-spinner ${styles.spinner}`} />
                    <span>Đang tải danh sách tài khoản...</span>
                  </div>
                </td>
              </tr>
            ) : !page?.items || page.items.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    <i className={`fas fa-user-slash ${styles.emptyIcon}`} />
                    <p>Không tìm thấy tài khoản nào phù hợp.</p>
                  </div>
                </td>
              </tr>
            ) : (
              page.items.map((item) => {
                const initial = (item.fullName || item.email || "U")
                  .charAt(0)
                  .toUpperCase();
                const roleConfig = ACCOUNT_TYPE_LABELS[item.role] || {
                  label: item.role,
                  cls: styles.roleLearner,
                  icon: "fa-user",
                };

                return (
                  <tr key={item.accountId}>
                    <td>
                      <div className={styles.accountCell}>
                        <div className={styles.accountAvatar}>{initial}</div>
                        <div className={styles.accountInfo}>
                          <span className={styles.accountName}>
                            {item.fullName || "Chưa cập nhật tên"}
                          </span>
                          <span className={styles.accountEmail}>{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${roleConfig.cls}`}>
                        <i className={`fas ${roleConfig.icon}`} /> {roleConfig.label}
                      </span>
                    </td>
                    <td>
                      {item.hasOverride ? (
                        <span
                          className={`${styles.overrideStatusBadge} ${styles.hasOverride}`}
                        >
                          <i className="fas fa-check-circle" /> Cấu hình riêng
                        </span>
                      ) : (
                        <span
                          className={`${styles.overrideStatusBadge} ${styles.noOverride}`}
                        >
                          <i className="fas fa-minus-circle" /> Theo mặc định
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => onManage(item)}
                        className={styles.actionButton}
                      >
                        <i className="fas fa-gear" /> Quản lý
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {page && page.totalPages > 0 && (
        <div className={styles.paginationFooter}>
          <div className={styles.pageSummary}>
            Hiển thị <strong>{page.items?.length ?? 0}</strong> /{" "}
            <strong>{page.totalItems}</strong> tài khoản
          </div>

          <div className={styles.pageControls}>
            <button
              type="button"
              disabled={page.pageNumber <= 0 || loading}
              onClick={() => setPageIndex(pageIndex - 1)}
              className={styles.pageButton}
            >
              <i className="fas fa-chevron-left" /> Trước
            </button>

            <span className={styles.pageIndicator}>
              Trang {page.pageNumber + 1} / {page.totalPages}
            </span>

            <button
              type="button"
              disabled={page.pageNumber + 1 >= page.totalPages || loading}
              onClick={() => setPageIndex(pageIndex + 1)}
              className={styles.pageButton}
            >
              Sau <i className="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
