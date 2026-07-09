import { useNavigate } from "react-router-dom";
import styles from "../Quiz.module.css";

/** Spinner toàn màn khi đang tải. */
export function LoadingState({ label = "Đang tải..." }) {
  return (
    <div className={styles.state}>
      <div className={styles.spinner}>
        <i className="fas fa-spinner fa-spin" />
      </div>
      <p className={styles.stateDesc} style={{ marginTop: 16 }}>
        {label}
      </p>
    </div>
  );
}

/**
 * Empty state thân thiện (không phải lỗi).
 */
export function EmptyState({ icon = "fa-clipboard-list", title, desc, children }) {
  return (
    <div className={styles.state}>
      <div className={`${styles.stateIcon} ${styles.stateIconEmpty}`}>
        <i className={`fas ${icon}`} />
      </div>
      <p className={styles.stateTitle}>{title}</p>
      {desc && <p className={styles.stateDesc}>{desc}</p>}
      {children}
    </div>
  );
}

/**
 * Map errorCode (spec mục 2.5) → nội dung + hành động khắc phục.
 */
export function ErrorState({ error, courseId }) {
  const navigate = useNavigate();
  const code = error?.errorCode || "UNKNOWN";

  const map = {
    UNAUTHORIZED: {
      icon: "fa-lock",
      title: "Phiên đăng nhập đã hết hạn",
      desc: "Vui lòng đăng nhập lại để tiếp tục làm bài kiểm tra.",
      action: { label: "Đăng nhập", onClick: () => navigate("/") },
    },
    ENROLLMENT_NOT_FOUND: {
      icon: "fa-user-graduate",
      title: "Bạn chưa đăng ký khóa học này",
      desc: "Hãy đăng ký khóa học để có thể làm bài kiểm tra.",
      action: {
        label: "Đăng ký khóa học",
        onClick: () => navigate(`/courses/${courseId}`),
      },
    },
    FORBIDDEN: {
      icon: "fa-ban",
      title: "Không có quyền truy cập",
      desc: "Bạn không thể xem lượt làm bài này.",
    },
    ANSWERS_HIDDEN: {
      icon: "fa-eye-slash",
      title: "Bài kiểm tra không cho xem lại đáp án",
      desc: "Cấu hình bài kiểm tra này không hiển thị chi tiết đáp án đúng/sai.",
    },
    QUIZ_NOT_FOUND: {
      icon: "fa-clipboard",
      title: "Không tìm thấy bài kiểm tra",
      desc: "Khóa học này chưa có bài kiểm tra tương ứng.",
      action: {
        label: "Quay lại khóa học",
        onClick: () => navigate(`/learning/${courseId}`),
      },
    },
    ATTEMPT_NOT_FOUND: {
      icon: "fa-triangle-exclamation",
      title: "Không tìm thấy lượt làm bài",
      desc: "Lượt làm bài không hợp lệ. Vui lòng bắt đầu lại.",
    },
    NO_RESULT: {
      icon: "fa-clipboard-list",
      title: "Chưa có kết quả",
      desc: "Bạn chưa hoàn thành lượt làm bài nào cho bài kiểm tra này.",
    },
    QUIZ_NOT_CONFIGURED: {
      icon: "fa-screwdriver-wrench",
      title: "Bài kiểm tra chưa sẵn sàng",
      desc: "Bài kiểm tra chưa có đủ câu hỏi/đáp án. Vui lòng quay lại sau.",
    },
    INVALID_SUBMISSION: {
      icon: "fa-triangle-exclamation",
      title: "Không thể nộp bài",
      desc: "Dữ liệu bài làm không hợp lệ. Vui lòng thử lại.",
    },
  };

  const info = map[code] || {
    icon: "fa-triangle-exclamation",
    title: "Đã xảy ra lỗi",
    desc: error?.errorMessage || "Vui lòng thử lại sau.",
  };

  return (
    <div className={styles.state}>
      <div className={`${styles.stateIcon} ${styles.stateIconError}`}>
        <i className={`fas ${info.icon}`} />
      </div>
      <p className={styles.stateTitle}>{info.title}</p>
      <p className={styles.stateDesc}>{info.desc}</p>
      {info.action && (
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={info.action.onClick}
        >
          {info.action.label}
        </button>
      )}
    </div>
  );
}
