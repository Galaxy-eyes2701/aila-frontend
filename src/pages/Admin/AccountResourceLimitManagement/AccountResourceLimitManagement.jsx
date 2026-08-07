import { useEffect, useState } from "react";
import styles from "./AccountResourceLimitManagement.module.css";

import {
  getDefaultResourceLimitPolicies,
  updateDefaultResourceLimitPolicies,
  getOverrideEligibleAccounts,
} from "../services/resourceLimitApi";

import CreateOverrideModal from "./CreateOverrideModal";
import OverrideDetailModal from "./OverrideDetailModal";
import EditOverrideModal from "./EditOverrideModal";

export default function AccountResourceLimitManagement() {
  const [loading, setLoading] = useState(false);

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

  const [pageIndex, setPageIndex] = useState(0);

  const [pageSize, setPageSize] = useState(10);

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
        error.response?.data?.errorMessage ??
          "Có lỗi xảy ra khi tải chính sách",
      );
    } finally {
      setLoading(false);
    }
  }

  function updatePolicyValue(index, field, value) {
    const clone = [...policies];

    clone[index] = {
      ...clone[index],
      [field]: Number(value),
    };

    setPolicies(clone);
  }

  async function savePolicies() {
    try {
      setLoading(true);

      clearMessage();

      const response = await updateDefaultResourceLimitPolicies(policies);

      if (!response.success) {
        setErrorMessage(
          response.errorMessage ?? "Cập nhật chính sách thất bại",
        );

        return;
      }

      setSuccessMessage("Cập nhật chính sách thành công");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi cập nhật",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAccounts() {
    try {
      setLoading(true);

      clearMessage();

      const response = await getOverrideEligibleAccounts({
        keyword,

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
        error.response?.data?.errorMessage ?? "Có lỗi xảy ra khi tải tài khoản",
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
  }, [pageIndex, pageSize]);

  function handleManageAccount(account) {
    setSelectedAccount(account);

    if (account.hasOverride) {
      setShowDetailModal(true);
    } else {
      setShowCreateModal(true);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Quản lý giới hạn tài nguyên</h1>

      {errorMessage && (
        <div className={`${styles.message} ${styles.error}`}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className={`${styles.message} ${styles.success}`}>
          {successMessage}
        </div>
      )}

      {loading && <div className={styles.loading}>Đang tải dữ liệu...</div>}

      {/* ==========================
            UC-85
            Default Policy
        =========================== */}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cấu hình tài nguyên mặc định</h2>

        <p className={styles.description}>
          Thiết lập giới hạn tài nguyên mặc định cho từng loại tài khoản.
        </p>

        <PolicyTable
          policies={policies}
          onChange={updatePolicyValue}
          onSave={savePolicies}
        />
      </section>

      {/* ==========================
            UC-86
            Override Account
        =========================== */}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Ghi đè cấu hình tài nguyên tài khoản
        </h2>

        <p className={styles.description}>
          Cho phép Admin thiết lập giới hạn riêng cho từng tài khoản.
        </p>

        <AccountTable
          page={accountPage}
          keyword={keyword}
          setKeyword={setKeyword}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          onSearch={() => {
            setPageIndex(0);
            loadAccounts();
          }}
          onManage={handleManageAccount}
        />
      </section>

      {showCreateModal && selectedAccount && (
        <CreateOverrideModal
          account={selectedAccount}
          onClose={() => {
            setShowCreateModal(false);
          }}
          onSuccess={() => {
            setShowCreateModal(false);

            setSelectedAccount(null);

            loadAccounts();

            setSuccessMessage("Tạo cấu hình tài nguyên thành công");
          }}
        />
      )}

      {showDetailModal && selectedAccount && (
        <OverrideDetailModal
          account={selectedAccount}
          onClose={() => {
            setShowDetailModal(false);
          }}
          onEdit={(data) => {
            setSelectedOverride(data);

            setShowDetailModal(false);

            setShowEditModal(true);
          }}
          onSuccess={() => {
            setShowDetailModal(false);

            setSelectedAccount(null);

            loadAccounts();

            setSuccessMessage("Xóa cấu hình tài nguyên thành công");
          }}
        />
      )}

      {showEditModal && selectedAccount && selectedOverride && (
        <EditOverrideModal
          account={selectedAccount}
          data={selectedOverride}
          onClose={() => {
            setShowEditModal(false);
          }}
          onSuccess={() => {
            setShowEditModal(false);

            setSelectedAccount(null);

            setSelectedOverride(null);

            loadAccounts();

            setSuccessMessage("Cập nhật cấu hình tài nguyên thành công");
          }}
        />
      )}
    </div>
  );
}

function PolicyTable({ policies, onChange, onSave }) {
  return (
    <div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Loại tài khoản</th>

              <th>Token AI</th>

              <th>Lượt thực hành AI</th>

              <th>Lượt yêu cầu đánh giá chuyên gia</th>
            </tr>
          </thead>

          <tbody>
            {policies.map((item, index) => (
              <tr key={item.accountType}>
                <td>{item.accountType}</td>

                <td>
                  <input
                    type="number"
                    value={item.aiTokenLimit}
                    onChange={(e) =>
                      onChange(index, "aiTokenLimit", e.target.value)
                    }
                    className={styles.input}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={item.aiPracticeScenarioLimit}
                    onChange={(e) =>
                      onChange(index, "aiPracticeScenarioLimit", e.target.value)
                    }
                    className={styles.input}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={item.expertEvaluationRequestLimit}
                    onChange={(e) =>
                      onChange(
                        index,
                        "expertEvaluationRequestLimit",
                        e.target.value,
                      )
                    }
                    className={styles.input}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={onSave} className={styles.primaryButton}>
        Lưu thay đổi
      </button>
    </div>
  );
}

function AccountTable({
  page,

  keyword,

  setKeyword,

  pageIndex,

  setPageIndex,

  onSearch,

  onManage,
}) {
  if (!page) {
    return null;
  }

  return (
    <div>
      <div className={styles.searchContainer}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm email, tên tài khoản..."
          className={styles.searchInput}
        />

        <button onClick={onSearch} className={styles.primaryButton}>
          Tìm kiếm
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>

              <th>Họ tên</th>

              <th>Vai trò</th>

              <th>Có cấu hình riêng</th>

              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {page.items?.map((item) => (
              <tr key={item.accountId}>
                <td>{item.email}</td>

                <td>{item.fullName ?? "-"}</td>

                <td>{item.role}</td>

                <td>{item.hasOverride ? "Có" : "Không"}</td>

                <td>
                  <button
                    onClick={() => {
                      onManage(item);
                    }}
                    className={styles.linkButton}
                  >
                    Quản lý
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button
          disabled={page.pageNumber <= 0}
          onClick={() => {
            setPageIndex(pageIndex - 1);
          }}
          className={styles.pageButton}
        >
          Trước
        </button>

        <span className={styles.pageInfo}>
          Trang {page.pageNumber + 1}/{page.totalPages}
        </span>

        <button
          disabled={page.pageNumber + 1 >= page.totalPages}
          onClick={() => {
            setPageIndex(pageIndex + 1);
          }}
          className={styles.pageButton}
        >
          Sau
        </button>
      </div>

      <div className={styles.pageInfo}>
        Hiển thị: {page.items?.length ?? 0} / {page.totalItems} tài khoản
      </div>
    </div>
  );
}
