import { Link } from "react-router-dom";
import RequestEvaluationButton from "../../ExpertEvaluation/RequestEvaluationButton";
import styles from "../AIPractice.module.css";

/**
 * UC-28 — Hiển thị kết quả đánh giá AI sau khi kết thúc phiên luyện tập.
 * Dùng chung cho UC-27 (vừa xong) và UC-28 (xem lại từ lịch sử).
 *
 * @param {string=} attemptId     bật nút UC-29 "Nhờ chuyên gia đánh giá"
 * @param {string=} attemptStatus "Completed" | "InProgress" | "Abandoned"
 * @param {string=} expertEvaluationRequestId  yêu cầu đã gửi trước đó (nếu backend trả)
 */
export default function PracticeResult({
  result,
  courseId,
  materialId,
  onPracticeAgain,
  attemptId,
  attemptStatus,
  expertEvaluationRequestId = null,
}) {
  // Tương thích cả camelCase lẫn PascalCase từ API
  const scoring =
    result?.detailedScoring ??
    result?.DetailedScoring ??
    result?.scoring;

  // Giữ null khi chưa có điểm để phân biệt với điểm 0 (UC-29 cần biết đã chấm AI chưa).
  const rawScore =
    scoring?.percentage ??
    scoring?.Percentage ??
    result?.finalScore ??
    result?.FinalScore ??
    null;

  const score = rawScore ?? 0;

  const grade   = scoring?.grade   ?? scoring?.Grade   ?? "";
  const summary = scoring?.summary ?? scoring?.Summary ?? result?.overallSuggestion ?? result?.OverallSuggestion ?? "";
  const criteria     = scoring?.criteria          ?? scoring?.Criteria          ?? [];
  const suggestions  = scoring?.learningSuggestions ?? scoring?.LearningSuggestions ?? [];
  const issues       = scoring?.detectedIssues    ?? scoring?.DetectedIssues    ?? [];

  // Backend chỉ nhận yêu cầu chuyên gia khi lượt đã có kết quả chấm của AI.
  const hasAiEvaluation = rawScore !== null || criteria.length > 0;

  function gradeClass(g) {
    const u = (g ?? "").toLowerCase();
    if (u.includes("excellent")) return styles.gradeExcellent;
    if (u.includes("pass"))      return styles.gradePass;
    return styles.gradeFail;
  }

  function gradeLabel(g) {
    const u = (g ?? "").toLowerCase();
    if (u.includes("excellent"))  return "Xuất sắc";
    if (u.includes("pass"))       return "Đạt";
    if (u.includes("systembusy")) return "Hệ thống bận";
    return "Cần cải thiện";
  }

  return (
    <div className={styles.resultPanel}>
      <h2 className={styles.resultTitle}>
        <i className="fas fa-chart-bar" /> Kết quả đánh giá
      </h2>

      {/* Score */}
      <div className={styles.scoreRow}>
        <div>
          <div className={styles.scoreBig}>{Math.round(score)}%</div>
          <div className={styles.scoreLabel}>Điểm tổng</div>
        </div>
        <span className={`${styles.gradeTag} ${gradeClass(grade)}`}>
          <i className="fas fa-award" /> {gradeLabel(grade)}
        </span>
      </div>

      {/* UC-29 — nhờ chuyên gia đánh giá, đặt ngay cạnh phần điểm AI.
          Đã gửi yêu cầu trước đó (xem lại từ lịch sử) -> đổi hẳn sang lời mời xem kết quả. */}
      {attemptId && (
        <div className={styles.expertCta}>
          <div className={styles.expertCtaText}>
            <p className={styles.expertCtaTitle}>
              {expertEvaluationRequestId
                ? "Bạn đã nhờ chuyên gia đánh giá bài này"
                : "Muốn góc nhìn của chuyên gia?"}
            </p>
            <p className={styles.expertCtaDesc}>
              {expertEvaluationRequestId
                ? "Xem trạng thái yêu cầu và phản hồi riêng của chuyên gia phụ trách khóa học."
                : "Chuyên gia phụ trách khóa học sẽ chấm lại bài của bạn và đưa phản hồi riêng."}
            </p>
          </div>
          <RequestEvaluationButton
            attemptId={attemptId}
            attemptStatus={attemptStatus}
            hasAiEvaluation={hasAiEvaluation}
            requestId={expertEvaluationRequestId}
          />
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Nhận xét tổng thể</p>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      {/* Criteria breakdown */}
      {criteria.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Chi tiết từng tiêu chí</p>
          <div className={styles.criteriaList}>
            {criteria.map((c, i) => {
              const s   = c.score   ?? c.Score   ?? 0;
              const max = c.maxScore ?? c.MaxScore ?? 100;
              const pct = max > 0 ? (s / max) * 100 : 0;
              const fb  = c.feedback  ?? c.Feedback  ?? c.evaluation ?? c.Evaluation ?? "";
              const nm  = c.criteriaName ?? c.CriteriaName ?? `Tiêu chí ${i + 1}`;
              return (
                <div key={c.id ?? c.Id ?? i} className={styles.criteriaItem}>
                  <div className={styles.criteriaHeader}>
                    <span className={styles.criteriaName}>{nm}</span>
                    <span className={styles.criteriaScore}>{s}/{max}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  {fb && <p className={styles.criteriaFeedback}>{fb}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Vấn đề phát hiện</p>
          <ul className={styles.listItems}>
            {issues.map((item, i) => (
              <li key={i} className={styles.listItem}>
                <i className="fas fa-triangle-exclamation" style={{ color: "#d97706" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Đề xuất cải thiện</p>
          <ul className={styles.listItems}>
            {suggestions.map((item, i) => (
              <li key={i} className={styles.listItem}>
                <i className="fas fa-lightbulb" style={{ color: "#16a34a" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className={styles.bottomActions}>
        {onPracticeAgain && (
          <button className={styles.btnPrimary} onClick={onPracticeAgain}>
            <i className="fas fa-rotate-right" /> Luyện tập lại
          </button>
        )}
        {courseId && (
          <Link to={`/learning/${courseId}`} className={styles.btnGhost}>
            <i className="fas fa-arrow-left" /> Về khóa học
          </Link>
        )}
      </div>
    </div>
  );
}
