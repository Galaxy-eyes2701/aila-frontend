import { formatDateTime, formatRelativeTime } from "@services/expertEvaluationFormat";
import styles from "./ConversationThread.module.css";

/**
 * Lịch sử hội thoại của lượt thực hành (read-only) — dùng chung UC-30 & UC-63 detail.
 * Lượt bị từ chối: hiện cảnh báo + lý do, KHÔNG hiện aiResponse (backend trả chuỗi rỗng).
 */
export default function ConversationThread({ conversation }) {
  const turns = conversation ?? [];

  return (
    <section className={styles.thread}>
      <h3 className={styles.title}>
        <i className="fas fa-comments" aria-hidden="true" />
        Lịch sử hội thoại
        {turns.length > 0 && <span className={styles.count}>{turns.length} lượt</span>}
      </h3>

      {turns.length === 0 ? (
        <div className={styles.empty}>
          <i className="fas fa-comment-slash" aria-hidden="true" />
          <p>Lượt thực hành này chưa có hội thoại nào.</p>
        </div>
      ) : (
        <ol className={styles.list}>
          {turns.map((turn, index) => (
            <li key={turn.id} className={styles.turn}>
              <div className={styles.turnMeta}>
                <span className={styles.turnIndex}>Lượt {index + 1}</span>
                <time
                  className={styles.turnTime}
                  dateTime={turn.createdAt ?? undefined}
                  title={formatDateTime(turn.createdAt)}
                >
                  {formatRelativeTime(turn.createdAt)}
                </time>
              </div>

              {/* Bong bóng học viên — bên phải */}
              <div className={`${styles.row} ${styles.rowRight}`}>
                <div className={`${styles.bubble} ${styles.learnerBubble}`}>
                  <span className={styles.speaker}>
                    <i className="fas fa-user" aria-hidden="true" /> Học viên
                  </span>
                  <p className={styles.bubbleText}>{turn.userPrompt}</p>
                </div>
              </div>

              {turn.isRejected ? (
                <div className={`${styles.row} ${styles.rowLeft}`}>
                  <div className={`${styles.bubble} ${styles.rejectedBubble}`} role="note">
                    <span className={styles.speaker}>
                      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                      Prompt bị từ chối
                    </span>
                    <p className={styles.bubbleText}>
                      {turn.rejectionReason?.trim()
                        ? turn.rejectionReason
                        : "Hệ thống đã từ chối prompt này."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`${styles.row} ${styles.rowLeft}`}>
                  <div className={`${styles.bubble} ${styles.aiBubble}`}>
                    <span className={styles.speaker}>
                      <i className="fas fa-robot" aria-hidden="true" /> AI
                    </span>
                    <p className={styles.bubbleText}>{turn.aiResponse}</p>
                  </div>
                </div>
              )}

              {turn.suggestedPrompt?.trim() && (
                <div className={styles.suggestion}>
                  <span className={styles.suggestionLabel}>
                    <i className="fas fa-lightbulb" aria-hidden="true" /> Gợi ý prompt tốt hơn
                  </span>
                  <p className={styles.bubbleText}>{turn.suggestedPrompt}</p>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
