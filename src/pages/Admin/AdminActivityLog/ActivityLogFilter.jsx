import { useState } from "react";
import styles from "./ActivityLogFilter.module.css";

const ACTION_OPTIONS = [
  "Create",
  "Update",
  "Delete",
  "Publish",
  "Unpublish",
  "Approve",
  "Reject",
  "Lock",
  "Unlock",
];

const ACTION_LABELS = {
  Create: "Tạo",
  Update: "Cập nhật",
  Delete: "Xóa",
  Publish: "Xuất bản",
  Unpublish: "Hủy xuất bản",
  Approve: "Phê duyệt",
  Reject: "Từ chối",
  Lock: "Khóa",
  Unlock: "Mở khóa",
};

function ActivityLogFilter({ onSearch, loading }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    onSearch({
      startDate,
      endDate,
      action,
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setAction("");

    onSearch({
      startDate: "",
      endDate: "",
      action: "",
    });
  };

  return (
    <form className={styles.filterBar} onSubmit={handleSubmit}>
      <div className={styles.filterGroup}>
        <label htmlFor="startDate">Từ ngày</label>
        <input
          id="startDate"
          type="date"
          className={styles.filterInput}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="endDate">Đến ngày</label>
        <input
          id="endDate"
          type="date"
          className={styles.filterInput}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="action">Hành động</label>
        <select
          id="action"
          className={styles.filterSelect}
          value={action}
          onChange={(event) => setAction(event.target.value)}
        >
          <option value="">Tất cả hành động</option>
          {ACTION_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {ACTION_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          <i className="fas fa-search" />
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleReset}
          disabled={loading}
        >
          <i className="fas fa-rotate-right" />
          Làm mới
        </button>
      </div>
    </form>
  );
}

export default ActivityLogFilter;
