import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuizResultDetail } from "@services/learnerQuizApi";
import { LoadingState, ErrorState } from "./components/QuizStates";
import styles from "./Quiz.module.css";

/** Một option trong màn review, phân biệt bằng icon + nhãn (không chỉ màu). */
function ReviewOption({ option }) {
  const isCorrect = option.isCorrect;
  const isSelected = option.isSelected;

  let cls = styles.reviewOption;
  let icon = "fa-circle";
  let iconCls = styles.iconNeutral;
  let tag = null;

  if (isCorrect) {
    cls += ` ${styles.reviewOptionCorrect}`;
    icon = "fa-circle-check";
    iconCls = styles.iconCorrect;
    tag = (
      <span className={`${styles.reviewTag} ${styles.reviewTagCorrect}`}>
        {isSelected ? "Bạn chọn (đúng)" : "Đáp án đúng"}
      </span>
    );
  } else if (isSelected) {
    cls += ` ${styles.reviewOptionWrong}`;
    icon = "fa-circle-xmark";
    iconCls = styles.iconWrong;
    tag = (
      <span className={`${styles.reviewTag} ${styles.reviewTagWrong}`}>
        Bạn chọn (sai)
      </span>
    );
  }

  return (
    <div className={cls}>
      <i className={`fas ${icon} ${styles.reviewOptionIcon} ${iconCls}`} aria-hidden="true" />
      <span className={styles.optionText}>{option.content}</span>
      {tag}
    </div>
  );
}

function ReviewQuestionCard({ question, index }) {
  const options = [...(question.options || [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionHead}>
        <span className={styles.questionNumber} aria-hidden="true">
          {index + 1}
        </span>
        <span className={styles.questionContent}>{question.content}</span>
        <span
          className={`${styles.verdict} ${
            question.isCorrect ? styles.verdictCorrect : styles.verdictWrong
          }`}
          style={{ marginLeft: "auto" }}
        >
          <i
            className={`fas ${
              question.isCorrect ? "fa-check" : "fa-xmark"
            }`}
          />
          {question.isCorrect ? "Đúng" : "Sai"}
        </span>
      </div>

      <div className={styles.optionList}>
        {options.map((opt) => (
          <ReviewOption key={opt.optionId} option={opt} />
        ))}
      </div>
    </div>
  );
}

export default function QuizResultDetailPage() {
  const { courseId, materialId } = useParams();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getQuizResultDetail(courseId, materialId)
      .then((data) => {
        if (!alive) return;
        setDetail(data);
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

  const resultUrl = `/courses/${courseId}/materials/${materialId}/quiz/result`;

  if (status === "loading") {
    return (
      <Shell resultUrl={resultUrl}>
        <LoadingState label="Đang tải chi tiết đáp án..." />
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell resultUrl={resultUrl}>
        <ErrorState error={error} courseId={courseId} />
      </Shell>
    );
  }

  const questions = [...detail.questions].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <Shell resultUrl={resultUrl}>
      <div className={styles.reviewHead}>
        <div className={styles.reviewSummary}>
          Điểm số: <strong>{Math.round(detail.score)}/100</strong>
        </div>
        <div className={styles.reviewSummary}>
          Trả lời đúng:{" "}
          <strong>
            {detail.correctAnswers}/{detail.totalQuestions}
          </strong>{" "}
          câu
        </div>
        <span
          className={`${styles.verdict} ${
            detail.isPassed ? styles.verdictCorrect : styles.verdictWrong
          }`}
        >
          <i
            className={`fas ${
              detail.isPassed ? "fa-circle-check" : "fa-circle-xmark"
            }`}
          />
          {detail.isPassed ? "Đạt" : "Chưa đạt"}
        </span>
      </div>

      {questions.map((q, i) => (
        <ReviewQuestionCard key={q.questionId} question={q} index={i} />
      ))}
    </Shell>
  );
}

function Shell({ children, resultUrl }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={resultUrl} className={styles.backLink}>
          <i className="fas fa-arrow-left" /> Quay lại kết quả
        </Link>
        {children}
      </div>
    </div>
  );
}
