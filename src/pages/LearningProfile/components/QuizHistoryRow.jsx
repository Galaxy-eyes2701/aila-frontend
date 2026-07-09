import { Link } from "react-router-dom";
import { formatDateTime, formatScore } from "./helpers";
import styles from "../LearningProfile.module.css";

/** Một dòng lịch sử quiz. Link "Xem chi tiết" → màn kết quả UC-27. */
export default function QuizHistoryRow({ item }) {
  const detailUrl = `/courses/${item.courseId}/materials/${item.materialId}/quiz/result`;

  return (
    <div className={styles.quizRow}>
      <div className={styles.quizMain}>
        <div className={styles.quizTitle}>{item.quizTitle}</div>
        <div className={styles.quizCourse}>Khóa: {item.courseName}</div>
        <div className={styles.quizMetaRow}>
          <span className={styles.quizScore}>{formatScore(item.score)}/100</span>
          <span
            className={`${styles.passBadge} ${
              item.isPassed ? styles.passBadgePass : styles.passBadgeFail
            }`}
          >
            <i className={`fas ${item.isPassed ? "fa-check" : "fa-xmark"}`} />
            {item.isPassed ? "Đạt" : "Chưa đạt"}
          </span>
          {item.submittedAt && (
            <span className={styles.quizDate}>
              Nộp: {formatDateTime(item.submittedAt)}
            </span>
          )}
        </div>
      </div>

      <Link to={detailUrl} className={styles.viewDetail}>
        Xem chi tiết <i className="fas fa-arrow-right" />
      </Link>
    </div>
  );
}
