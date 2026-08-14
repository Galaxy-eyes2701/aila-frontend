import { Link } from "react-router-dom";
import { formatDateTime, formatScore } from "./helpers";
import styles from "../LearningProfile.module.css";

const DIFFICULTY_LABELS = { Easy: "Dễ", Medium: "Trung bình", Hard: "Khó" };
const DIFFICULTY_CLASS = {
  Easy: "diffEasy",
  Medium: "diffMedium",
  Hard: "diffHard",
};

/**
 * Một dòng lịch sử luyện tập AI scenario (UC-30, AC-5).
 * Link "Xem chi tiết" → màn kết quả phiên luyện tập UC-28.
 */
export default function AiScenarioRow({ item }) {
  const detailUrl = `/courses/${item.courseId}/materials/${item.materialId}/practice/${item.attemptId}/feedback`;
  const difficulty = item.difficulty || null;

  return (
    <div className={styles.quizRow}>
      <div className={styles.rowIcon}>
        <i className="fas fa-robot" />
      </div>

      <div className={styles.quizMain}>
        <div className={styles.quizTitle} title={item.scenarioName}>
          {item.scenarioName}
        </div>
        <div className={styles.quizCourse}>Khóa: {item.courseName}</div>
        <div className={styles.quizMetaRow}>
          <span className={styles.quizScore}>
            {item.score == null ? "—" : `${formatScore(item.score)}/100`}
          </span>
          {difficulty && (
            <span
              className={`${styles.diffBadge} ${
                styles[DIFFICULTY_CLASS[difficulty]] || ""
              }`}
            >
              <i className="fas fa-signal" />
              {DIFFICULTY_LABELS[difficulty] || difficulty}
            </span>
          )}
          <span className={styles.quizDate}>
            <i className="fas fa-clock" />{" "}
            {formatDateTime(item.completedAt || item.startedAt)}
          </span>
        </div>
      </div>

      <Link
        to={detailUrl}
        state={{ from: "profile" }}
        className={styles.viewDetail}
      >
        Xem chi tiết <i className="fas fa-arrow-right" />
      </Link>
    </div>
  );
}
