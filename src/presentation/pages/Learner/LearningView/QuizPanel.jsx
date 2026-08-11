// QuizPanel.jsx — hiển thị trong LearningContent cho học liệu loại Quiz.
// Chưa làm → chỉ nút "Bắt đầu làm bài". Đã có điểm → điểm số + "Làm lại" + "Xem kết quả".
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getQuizResult } from "@services/learnerQuizApi";
import styles from "./LearningView.module.css";

export default function QuizPanel({ courseId, materialId }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = () => {
      getQuizResult(courseId, materialId)
        .then((data) => {
          if (alive) setSummary(data);
        })
        .catch(() => {
          // Chưa làm / chưa có kết quả → coi như chưa làm (hiện nút bắt đầu)
          if (alive) setSummary({ hasResult: false });
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    };

    load();

    // Làm bài mở ở tab mới; khi quay lại tab này thì tải lại điểm mới nhất
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [courseId, materialId]);

  const takingUrl = `/courses/${courseId}/materials/${materialId}/quiz`;
  const resultUrl = `${takingUrl}/result`;

  if (loading) {
    return (
      <div className={styles.quizCta}>
        <div className={styles.contentSpinner}>
          <i className="fas fa-spinner fa-spin" /> Đang tải bài kiểm tra...
        </div>
      </div>
    );
  }

  const hasResult = summary?.hasResult;
  const passed = summary?.isPassed;

  return (
    <div className={styles.quizCta}>
      <div className={styles.quizCtaIcon}>
        <i className="fas fa-clipboard-question" />
      </div>
      <p className={styles.quizCtaTitle}>Bài kiểm tra</p>

      {hasResult ? (
        <>
          <div className={styles.quizScoreRow}>
            <div className={styles.quizScoreNum}>
              {Math.round(summary.score)}
              <span>/100</span>
            </div>
            <span
              className={`${styles.quizPassBadge} ${
                passed ? styles.quizPassBadgePass : styles.quizPassBadgeFail
              }`}
            >
              <i
                className={`fas ${
                  passed ? "fa-circle-check" : "fa-circle-xmark"
                }`}
              />
              {passed ? "Đạt" : "Chưa đạt"}
            </span>
          </div>

          <div className={styles.quizCtaActions}>
            <Link to={resultUrl} className={styles.quizStartBtn}>
              <i className="fas fa-list-check" /> Xem kết quả
            </Link>
            <Link
              to={takingUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.quizResultBtn}
            >
              <i className="fas fa-rotate-right" /> Làm lại
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className={styles.quizCtaDesc}>
            Hoàn thành bài kiểm tra để đánh giá kiến thức và cập nhật tiến độ
            khóa học.
          </p>
          <div className={styles.quizCtaActions}>
            <Link
              to={takingUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.quizStartBtn}
            >
              <i className="fas fa-play" /> Bắt đầu làm bài
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
