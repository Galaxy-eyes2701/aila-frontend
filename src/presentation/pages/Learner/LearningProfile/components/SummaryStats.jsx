import styles from "../LearningProfile.module.css";

/** 5 thẻ tổng quan. Thẻ cuối: số lượt luyện tập AI đã làm. */
export default function SummaryStats({ summary, aiScenarioCount = 0 }) {
  const items = [
    { num: summary.totalCourses, label: "Khóa học" },
    { num: summary.coursesInProgress, label: "Đang học" },
    { num: summary.coursesCompleted, label: "Hoàn thành" },
    { num: summary.totalQuizzesTaken, label: "Bài kiểm tra" },
    { num: aiScenarioCount, label: "Luyện tập AI" },
  ];

  return (
    <div className={styles.summaryGrid}>
      {items.map((it) => (
        <div key={it.label} className={styles.statCard}>
          <div className={styles.statNum}>{it.num}</div>
          <div className={styles.statLabel}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
