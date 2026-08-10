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
    <form className={styles.activityLogFilter} onSubmit={handleSubmit}>
      <div className={styles.filterField}>
        <label htmlFor="startDate">Ngày bắt đầu</label>

        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="endDate">Ngày kết thúc</label>

        <input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="action">Hành động</label>

        <select
          id="action"
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
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={loading}
        >
          {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={handleReset}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>
    </form>
  );
}

export default ActivityLogFilter;
