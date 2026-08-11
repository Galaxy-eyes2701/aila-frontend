import styles from "./ActivityLogTable.module.css";

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

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActionClass(action) {
  if (!action) {
    return styles.badge;
  }

  const actionClass = {
    Create: styles.actionCreate,
    Update: styles.actionUpdate,
    Delete: styles.actionDelete,
    Publish: styles.actionPublish,
    Unpublish: styles.actionUnpublish,
    Approve: styles.actionApprove,
    Reject: styles.actionReject,
    Lock: styles.actionLock,
    Unlock: styles.actionUnlock,
  };

  return `${styles.badge} ${actionClass[action] || styles.actionDefault}`;
}

function ActivityLogTable({ logs, loading }) {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Đang tải nhật ký hoạt động...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="fas fa-history" />
        <h3>Không tìm thấy dữ liệu nhật ký</h3>
        <p>Không tìm thấy dữ liệu nhật ký phù hợp với yêu cầu truy vấn.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Quản trị viên</th>
            <th>Hành động</th>
            <th>Mô tả</th>
            <th>Mốc thời gian</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>
                <div className={styles.adminCell}>
                  <div className={styles.adminAvatar}>
                    {log.adminName?.charAt(0)?.toUpperCase() || "A"}
                  </div>

                  <div>
                    <div className={styles.adminName}>{log.adminName || "Quản trị viên"}</div>
                    <div className={styles.adminId}>{log.adminId || log.id}</div>
                  </div>
                </div>
              </td>

              <td>
                <span className={getActionClass(log.action)}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>
              </td>

              <td>
                <span className={styles.descriptionCell}>
                  {log.description || "-"}
                </span>
              </td>

              <td>
                <span className={styles.timestampCell}>
                  <i className="far fa-clock" />
                  {formatDateTime(log.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityLogTable;
