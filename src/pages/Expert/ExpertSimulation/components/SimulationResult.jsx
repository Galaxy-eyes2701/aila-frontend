import styles from "../ExpertSimulation.module.css";

/**
 * Hiển thị kết quả đánh giá AI sau khi kết thúc simulation (Step 14 UC-60).
 *
 * @param {{ result: CompleteAttemptResponseDto, onRetry: () => void }} props
 */
export default function SimulationResult({ result, onRetry }) {
  const scoring = result?.detailedScoring ?? result?.DetailedScoring;
  const score = scoring?.percentage ?? scoring?.Percentage ?? result?.finalScore ?? result?.FinalScore ?? 0;
  const grade = scoring?.grade ?? scoring?.Grade ?? "";
  const summary = scoring?.summary ?? scoring?.Summary ?? result?.overallSuggestion ?? result?.OverallSuggestion ?? "";
  const criteria = scoring?.criteria ?? scoring?.Criteria ?? [];
  const suggestions = scoring?.learningSuggestions ?? scoring?.LearningSuggestions ?? [];
  const issues = scoring?.detectedIssues ?? scoring?.DetectedIssues ?? [];

  function gradeClass(g) {
    if (!g) return styles.gradeFail;
    const upper = g.toLowerCase();
    if (upper.includes("excellent")) return styles.gradeExcellent;
    if (upper.includes("pass")) return styles.gradePass;
    return styles.gradeFail;
  }

  function gradeLabel(g) {
    if (!g) return "Cần cải thiện";
    const upper = g.toLowerCase();
    if (upper.includes("excellent")) return "Xuất sắc";
    if (upper.includes("pass")) return "Đạt";
    if (upper.includes("systembusy")) return "Hệ thống bận";
    return "Cần cải thiện";
  }

  return (
    <div className={styles.resultPanel}>
      <h2 className={styles.resultTitle}>
        <i className="fas fa-chart-bar" /> Kết quả thử nghiệm
      </h2>

      {/* Score row */}
      <div className={styles.scoreRow}>
        <div>
          <div className={styles.scoreBig}>{Math.round(score)}%</div>
          <div className={styles.scoreLabel}>Điểm tổng</div>
        </div>
        <span className={`${styles.gradeTag} ${gradeClass(grade)}`}>
          <i className="fas fa-award" /> {gradeLabel(grade)}
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Nhận xét tổng thể</p>
          <p className={styles.summary}>{summary}</p>
        </div>
      )}

      {/* Criteria breakdown */}
      {criteria.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Chi tiết từng tiêu chí</p>
          <div className={styles.criteriaList}>
            {criteria.map((c, i) => {
              const s = c.score ?? c.Score ?? 0;
              const max = c.maxScore ?? c.MaxScore ?? 100;
              const pct = max > 0 ? (s / max) * 100 : 0;
              const feedback = c.feedback ?? c.Feedback ?? c.evaluation ?? c.Evaluation ?? "";
              const name = c.criteriaName ?? c.CriteriaName ?? `Tiêu chí ${i + 1}`;
              return (
                <div key={c.id ?? c.Id ?? i} className={styles.criteriaItem}>
                  <div className={styles.criteriaHeader}>
                    <span className={styles.criteriaName}>{name}</span>
                    <span className={styles.criteriaScore}>{s}/{max}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  {feedback && <p className={styles.criteriaFeedback}>{feedback}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issues detected */}
      {issues.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Vấn đề phát hiện</p>
          <ul className={styles.suggestionList}>
            {issues.map((item, i) => (
              <li key={i} className={styles.issueItem}>
                <i className="fas fa-triangle-exclamation" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learning suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Đề xuất cải thiện</p>
          <ul className={styles.suggestionList}>
            {suggestions.map((item, i) => (
              <li key={i} className={styles.suggestionItem}>
                <i className="fas fa-lightbulb" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Retry button */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button
          className={styles.finishBtn}
          style={{ background: "#2563eb" }}
          onClick={onRetry}
        >
          <i className="fas fa-rotate-right" /> Thử lại
        </button>
      </div>
    </div>
  );
}
