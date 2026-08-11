import styles from "../LearningProfile.module.css";

/** 5 thẻ tổng quan. Thẻ cuối: số AI scenario đã làm. */
export default function SummaryStats({ summary, aiScenarioCount = 0 }) {
  const items = [
    { num: summary.totalCourses, label: "Khóa học" },
    { num: summary.coursesInProgress, label: "Đang học" },
    { num: summary.coursesCompleted, label: "Hoàn thành" },
    { num: summary.totalQuizzesTaken, label: "Quiz đã làm" },
    { num: aiScenarioCount, label: "AI scenario đã làm" },
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
