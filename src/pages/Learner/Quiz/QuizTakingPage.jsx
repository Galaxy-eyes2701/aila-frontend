import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { startQuiz, submitQuiz } from "./services/quizApi";
import useCountdown from "./hooks/useCountdown";
import TimerBadge from "./components/TimerBadge";
import QuestionCard from "./components/QuestionCard";
import ConfirmSubmitModal from "./components/ConfirmSubmitModal";
import { LoadingState, ErrorState } from "./components/QuizStates";
import styles from "./Quiz.module.css";

export default function QuizTakingPage() {
  const { courseId, materialId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // Record<questionId, optionId[]>
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false); // khóa form khi hết giờ / đang nộp

  // Tránh nộp trùng: giữ cờ đã nộp qua các lần render.
  const submittedRef = useRef(false);

  // 1. Bắt đầu / tiếp tục lượt làm khi mở trang
  useEffect(() => {
    let alive = true;
    startQuiz(courseId, materialId)
      .then((data) => {
        if (!alive) return;
        setAttempt(data);
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

  const questions = useMemo(
    () =>
      attempt
        ? [...attempt.questions].sort((a, b) => a.orderIndex - b.orderIndex)
        : [],
    [attempt]
  );

  const answeredCount = Object.values(answers).filter(
    (ids) => ids && ids.length > 0
  ).length;

  const setAnswer = (questionId, optionIds) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIds }));
  };

  // 2. Nộp bài (dùng chung cho nộp tay & tự nộp khi hết giờ)
  const doSubmit = useCallback(
    async ({ auto } = { auto: false }) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setLocked(true);

      const payload = questions.map((q) => ({
        questionId: q.questionId,
        selectedOptionIds: answers[q.questionId] ?? [],
      }));

      try {
        const result = await submitQuiz(
          courseId,
          materialId,
          attempt.attemptId,
          payload
        );
        navigate(`/courses/${courseId}/materials/${materialId}/quiz/result`, {
          replace: auto,
          state: { justSubmitted: result },
        });
      } catch (err) {
        // Cho phép thử lại nếu lỗi mạng khi nộp tay
        submittedRef.current = false;
        setSubmitting(false);
        setShowConfirm(false);
        if (auto) {
          setLocked(true); // hết giờ vẫn khóa, nhưng báo lỗi
        } else {
          setLocked(false);
        }
        setError(err);
        setStatus("error");
      }
    },
    [answers, attempt, courseId, materialId, navigate, questions]
  );

  const handleExpire = useCallback(() => {
    doSubmit({ auto: true });
  }, [doSubmit]);

  const remainingMs = useCountdown(attempt?.deadlineAt, handleExpire);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <LoadingState label="Đang tải bài kiểm tra..." />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <ErrorState error={error} courseId={courseId} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={`/learning/${courseId}`} className={styles.backLink}>
          <i className="fas fa-arrow-left" /> Quay lại khóa học
        </Link>

        <header className={styles.quizHeader}>
          <div>
            <h1 className={styles.quizTitle}>Bài kiểm tra</h1>
            <p className={styles.answeredCount}>
              Đã trả lời <strong>{answeredCount}</strong>/{questions.length} câu
            </p>
          </div>
          <TimerBadge remainingMs={remainingMs} />
        </header>

        {locked && !submitting && (
          <div className={styles.state} style={{ padding: 20, marginBottom: 16 }}>
            <p className={styles.stateTitle} style={{ fontSize: 16 }}>
              <i className="fas fa-lock" /> Đã hết giờ — bài làm đã được khóa.
            </p>
          </div>
        )}

        {questions.map((q, i) => (
          <QuestionCard
            key={q.questionId}
            question={q}
            index={i}
            selectedOptionIds={answers[q.questionId] || []}
            onChange={setAnswer}
            disabled={locked}
          />
        ))}

        <div className={styles.submitBar}>
          <span className={styles.answeredCount}>
            <strong>{answeredCount}</strong>/{questions.length} câu đã trả lời
          </span>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setShowConfirm(true)}
            disabled={locked || submitting}
          >
            <i className="fas fa-paper-plane" /> Nộp bài
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmSubmitModal
          answeredCount={answeredCount}
          totalQuestions={questions.length}
          submitting={submitting}
          onConfirm={() => doSubmit({ auto: false })}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
