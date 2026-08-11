import {
  formatDateTime,
  formatScore,
} from "@services/expertEvaluationFormat";
import styles from "./AiEvaluationCard.module.css";

/**
 * Kết quả chấm tự động của AI: điểm lớn + gợi ý tổng thể.
 * `overallSuggestion` rỗng -> ẩn hẳn khối gợi ý.
 */
export default function AiEvaluationCard({ aiEvaluation }) {
  const hasSuggestion = Boolean(aiEvaluation?.overallSuggestion?.trim());

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.badge}>
          <i className="fas fa-robot" aria-hidden="true" /> Kết quả AI
        </span>
        {aiEvaluation?.evaluatedAt && (
          <time className={styles.time} dateTime={aiEvaluation.evaluatedAt}>
            {formatDateTime(aiEvaluation.evaluatedAt)}
          </time>
        )}
      </header>

      <div className={styles.scoreRow}>
        <span className={styles.score}>
          {formatScore(aiEvaluation?.finalScore, "Chưa chấm")}
        </span>
        <span className={styles.scoreLabel}>Điểm tổng do AI chấm</span>
      </div>

      {hasSuggestion && (
        <div className={styles.suggestion}>
          <h4 className={styles.suggestionTitle}>
            <i className="fas fa-lightbulb" aria-hidden="true" /> Gợi ý tổng thể
          </h4>
          <p className={styles.suggestionText}>{aiEvaluation.overallSuggestion}</p>
        </div>
      )}
    </section>
  );
}
