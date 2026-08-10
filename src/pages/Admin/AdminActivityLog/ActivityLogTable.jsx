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
    timeStyle: "medium",
  }).format(new Date(value));
}

function getActionClass(action) {
  if (!action) {
    return styles.activityAction;
  }

  const actionClass = {
    Create: styles.activityActionCreate,
    Update: styles.activityActionUpdate,
    Delete: styles.activityActionDelete,
    Publish: styles.activityActionPublish,
    Unpublish: styles.activityActionUnpublish,
    Approve: styles.activityActionApprove,
    Reject: styles.activityActionReject,
    Lock: styles.activityActionLock,
    Unlock: styles.activityActionUnlock,
  };

  return `${styles.activityAction} ${actionClass[action] || ""}`;
}

function ActivityLogTable({ logs, loading }) {
  if (loading) {
    return (
      <div className={styles.activityLogState}>
        <div className={styles.activityLogSpinner} />

        <p>Đang tải nhật ký hoạt động...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className={styles.activityLogEmpty}>
        <div className={styles.emptyIcon}>⏱</div>

        <h3>Không tìm thấy dữ liệu nhật ký</h3>

        <p>Không tìm thấy dữ liệu nhật ký phù hợp với yêu cầu truy vấn.</p>
      </div>
    );
  }

  return (
    <div className={styles.activityLogTableWrapper}>
      <table className={styles.activityLogTable}>
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
                    <div className={styles.adminName}>{log.adminName}</div>

                    <div className={styles.adminId}>{log.adminId}</div>
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
