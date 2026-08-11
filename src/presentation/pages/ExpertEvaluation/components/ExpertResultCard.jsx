import {
  formatDateTime,
  formatScore,
} from "@services/expertEvaluationFormat";
import styles from "./ExpertResultCard.module.css";

/**
 * Kết quả chấm của chuyên gia — READ-ONLY tuyệt đối, không có nút sửa/xóa.
 * `recommendation === null` nghĩa là chuyên gia không đưa khuyến nghị -> ẩn hẳn khối.
 */
export default function ExpertResultCard({
  evaluation,
  comparison,
  footnote,
}) {
  if (!evaluation) return null;

  const hasRecommendation = Boolean(evaluation.recommendation?.trim());

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.badge}>
          <i className="fas fa-user-tie" aria-hidden="true" /> Kết quả chuyên gia
        </span>
        {evaluation.evaluatedAt && (
          <time className={styles.time} dateTime={evaluation.evaluatedAt}>
            {formatDateTime(evaluation.evaluatedAt)}
          </time>
        )}
      </header>

      <div className={styles.scoreRow}>
        <span className={styles.score}>{formatScore(evaluation.overallScore)}</span>
        <span className={styles.scoreLabel}>Điểm chuyên gia chấm</span>
      </div>

      {comparison && (
        <p className={styles.comparison}>
          <i className="fas fa-scale-balanced" aria-hidden="true" /> {comparison}
        </p>
      )}

      <div className={styles.block}>
        <h4 className={styles.blockTitle}>
          <i className="fas fa-comment-dots" aria-hidden="true" /> Phản hồi
        </h4>
        <p className={styles.blockText}>{evaluation.feedback}</p>
      </div>

      {hasRecommendation && (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>
            <i className="fas fa-compass" aria-hidden="true" /> Khuyến nghị
          </h4>
          <p className={styles.blockText}>{evaluation.recommendation}</p>
        </div>
      )}

      {footnote && (
        <p className={styles.footnote}>
          <i className="fas fa-lock" aria-hidden="true" /> {footnote}
        </p>
      )}
    </section>
  );
}
