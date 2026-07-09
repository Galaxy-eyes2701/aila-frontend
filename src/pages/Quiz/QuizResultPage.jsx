import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { getQuizResult } from "./services/quizApi";
import { LoadingState, ErrorState, EmptyState } from "./components/QuizStates";
import styles from "./Quiz.module.css";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuizResultPage() {
  const { courseId, materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Vừa nộp xong → hiển thị toast (điểm + tiến độ đã cập nhật)
  const justSubmitted = location.state?.justSubmitted;
  const [showToast, setShowToast] = useState(!!justSubmitted);

  useEffect(() => {
    if (!showToast) return undefined;
    const id = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(id);
  }, [showToast]);

  useEffect(() => {
    let alive = true;
    getQuizResult(courseId, materialId)
      .then((data) => {
        if (!alive) return;
        setSummary(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [courseId, materialId]);

  const takingUrl = `/courses/${courseId}/materials/${materialId}/quiz`;
  const detailUrl = `/courses/${courseId}/materials/${materialId}/quiz/result/detail`;

  if (status === "loading") {
    return (
      <Shell>
        <LoadingState label="Đang tải kết quả..." />
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell courseId={courseId}>
        <ErrorState error={error} courseId={courseId} />
      </Shell>
    );
  }

  // Chưa từng nộp → empty state thân thiện
  if (!summary?.hasResult) {
    return (
      <Shell courseId={courseId}>
        <EmptyState
          icon="fa-clipboard-list"
          title="Bạn chưa làm bài kiểm tra này"
          desc="Hãy bắt đầu làm bài để kiểm tra kiến thức của mình."
        >
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => navigate(takingUrl)}
          >
            <i className="fas fa-play" /> Bắt đầu làm bài
          </button>
        </EmptyState>
      </Shell>
    );
  }

  const passed = summary.isPassed;

  return (
    <Shell courseId={courseId}>
      <div className={styles.resultCard}>
        <div
          className={`${styles.scoreRing} ${
            passed ? styles.scoreRingPass : styles.scoreRingFail
          }`}
        >
          <div>
            <div className={styles.scoreValue}>
              {Math.round(summary.score)}
              <span>/100</span>
            </div>
            <div className={styles.scoreLabel}>Điểm số</div>
          </div>
        </div>

        <div
          className={`${styles.passBadge} ${
            passed ? styles.passBadgePass : styles.passBadgeFail
          }`}
        >
          <i className={`fas ${passed ? "fa-circle-check" : "fa-circle-xmark"}`} />
          {passed ? "Đạt" : "Chưa đạt"}
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNum}>
              {summary.correctAnswers ?? 0}/{summary.totalQuestions}
            </div>
            <div className={styles.statCaption}>Câu đúng</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>{Math.round(summary.score)}</div>
            <div className={styles.statCaption}>Điểm đạt được</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>{Math.round(summary.passingScore)}</div>
            <div className={styles.statCaption}>Điểm cần đạt</div>
          </div>
        </div>

        <p className={styles.completedAt}>
          <i className="fas fa-clock" /> Hoàn thành lúc{" "}
          {formatDateTime(summary.submittedAt)}
        </p>

        <div className={styles.resultActions}>
          {summary.canViewDetails ? (
            <Link to={detailUrl} className={`${styles.btn} ${styles.btnPrimary}`}>
              <i className="fas fa-list-check" /> Xem chi tiết đáp án
            </Link>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled
              title="Bài kiểm tra không cho xem lại đáp án"
            >
              <i className="fas fa-eye-slash" /> Xem chi tiết đáp án
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => navigate(takingUrl)}
          >
            <i className="fas fa-rotate-right" /> Làm lại
          </button>
        </div>

        {!summary.canViewDetails && (
          <p className={styles.disabledHint}>
            Bài kiểm tra này không cho xem lại đáp án.
          </p>
        )}
      </div>

      {showToast && (
        <div className={styles.toast}>
          <i className="fas fa-circle-check" />
          Nộp bài thành công! Điểm: {Math.round(justSubmitted.score)}/100
          {typeof justSubmitted.progressPct === "number" &&
            ` · Tiến độ khóa học: ${Math.round(justSubmitted.progressPct)}%`}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, courseId }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {courseId && (
          <Link to={`/learning/${courseId}`} className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Quay lại khóa học
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
