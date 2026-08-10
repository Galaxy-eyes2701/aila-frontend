import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAttemptDetail } from "./services/practiceApi";
import PracticeResult from "./components/PracticeResult";
import styles from "./AIPractice.module.css";

/**
 * UC-28 — Learner xem lại kết quả đánh giá của một phiên luyện tập.
 *
 * Route: /courses/:courseId/materials/:materialId/practice/:attemptId/feedback
 *
 * Spec: AF-02 — nếu chưa có evaluation, gọi lại AI để tạo (backend tự handle
 * trong GetAttemptDetailQueryHandler: nếu AIFeedback null → fallback gọi ScoringService).
 */
export default function AIPracticeFeedbackPage() {
  const { courseId, materialId, attemptId } = useParams();

  const [loading, setLoading]   = useState(true);
  const [attempt, setAttempt]   = useState(null);
  const [error, setError]       = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAttemptDetail(attemptId)
      .then((data) => {
        setAttempt(data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.errorMessage ||
          "Không thể tải kết quả phiên luyện tập. Vui lòng thử lại."
        );
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.center}>
            <div className={styles.spinnerLg} />
            <p>Đang tải kết quả đánh giá...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to={`/learning/${courseId}`} className={styles.backBtn}>
            <i className="fas fa-arrow-left" /> Về khóa học
          </Link>
          <div className={styles.errorBox}>
            <i className="fas fa-circle-exclamation" />{error}
          </div>
        </div>
      </div>
    );
  }

  // AF-01 — session không thuộc learner này (backend throw NotFoundException → error trên)
  if (!attempt) return null;

  const submissions = attempt.submissions ?? attempt.Submissions ?? [];
  const validMsgs   = submissions.filter((s) => !(s.isRejected ?? s.IsRejected));

  // Mặc định kiểm tra status
  const status = (attempt.status ?? attempt.Status ?? "").toLowerCase();
  const isCompleted = status === "completed";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={`/learning/${courseId}`} className={styles.backBtn}>
          <i className="fas fa-arrow-left" /> Về khóa học
        </Link>

        <h1 className={styles.pageTitle}>
          <i className="fas fa-clipboard-check" style={{ marginRight: 8 }} />
          Phản hồi thực hành AI
        </h1>
        <p className={styles.pageSubtitle}>
          Xem lại kết quả và lịch sử hội thoại của phiên luyện tập này.
        </p>

        {/* Attempt meta */}
        <div className={styles.hintsBar}>
          <span className={`${styles.hintChip} ${isCompleted ? styles.hintChipGreen : ""}`}>
            <i className={`fas ${isCompleted ? "fa-check-circle" : "fa-clock"}`} />
            {isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
          </span>
          <span className={styles.hintChip}>
            <i className="fas fa-comments" /> {validMsgs.length} lượt hợp lệ
          </span>
          {attempt.finalScore != null && (
            <span className={`${styles.hintChip} ${styles.hintChipGreen}`}>
              <i className="fas fa-star" /> {Math.round(attempt.finalScore ?? attempt.FinalScore ?? 0)}%
            </span>
          )}
        </div>

        {/* Conversation history (BR-02: chỉ hiển thị tin nhắn đã được xử lý thành công) */}
        <button
          className={styles.historyToggle}
          onClick={() => setShowHistory((v) => !v)}
        >
          <i className={`fas ${showHistory ? "fa-chevron-up" : "fa-chevron-down"}`} />
          {showHistory ? "Ẩn" : "Xem"} lịch sử hội thoại ({validMsgs.length} tin)
        </button>

        {showHistory && (
          <div className={styles.chatArea} style={{ marginBottom: 14 }}>
            <div className={styles.chatMessages}>
              {validMsgs.length === 0 ? (
                <div className={styles.emptyChat}>
                  <i className="fas fa-robot" />
                  <p>Không có tin nhắn hợp lệ nào trong phiên này.</p>
                </div>
              ) : (
                validMsgs.map((s) => (
                  <div key={s.id ?? s.Id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.msgUser}>
                      <p className={`${styles.msgLabel} ${styles.msgLabelRight}`}>Bạn</p>
                      <div className={styles.bubbleUser}>{s.userPrompt ?? s.UserPrompt}</div>
                    </div>
                    {(s.aiResponse ?? s.AiResponse) && (
                      <div className={styles.msgAi}>
                        <p className={styles.msgLabel}>AI</p>
                        <div className={styles.bubbleAi}>{s.aiResponse ?? s.AiResponse}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* UC-28 AF-02: backend tự re-evaluate nếu chưa có, trả detailedScoring */}
        {isCompleted ? (
          <PracticeResult
            result={attempt}
            courseId={courseId}
            materialId={materialId}
          />
        ) : (
          <div className={styles.errorBox} style={{ marginTop: 8 }}>
            <i className="fas fa-circle-info" style={{ color: "#2563eb" }} />
            Phiên luyện tập này chưa hoàn thành, chưa có kết quả đánh giá.
          </div>
        )}
      </div>
    </div>
  );
}
