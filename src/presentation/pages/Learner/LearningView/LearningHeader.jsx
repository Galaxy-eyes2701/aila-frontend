// LearningHeader.jsx
import { Link } from "react-router-dom";
import styles from "./LearningView.module.css";

export default function LearningHeader({ courseId, progress, onToggleSidebar }) {
  return (
    <div className={styles.learningHeader}>
      <div className={styles.headerLeft}>
        <Link to={`/courses/${courseId}`} className={styles.backLink} title="Về trang khóa học">
          <i className="fas fa-arrow-left" />
        </Link>
        <h1 className={styles.courseTitle}>Khóa học đang diễn ra</h1>
        <button
          type="button"
          className={styles.mobileSidebarToggle}
          onClick={onToggleSidebar}
          title="Mở danh sách bài học"
        >
          <i className="fas fa-list-ul" />
          <span>Bài học</span>
        </button>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.progressContainer}>
          <span className={styles.progressText}>
            Tiến độ: {progress?.completedMaterials || 0}/
            {progress?.totalMaterials || 0} ({progress?.percent || 0}%)
          </span>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress?.percent || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
