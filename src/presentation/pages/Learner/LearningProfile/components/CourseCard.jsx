import { useNavigate } from "react-router-dom";
import styles from "../LearningProfile.module.css";

/** Thẻ khóa học đã enroll (dùng cho dashboard lẫn trang xem tất cả). */
export default function CourseCard({ enrollment: en }) {
  const navigate = useNavigate();
  const completed = en.status === "Completed";
  const pct = Math.round(en.progressPct);

  return (
    <div
      className={styles.courseCard}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/courses/${en.courseId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/courses/${en.courseId}`);
      }}
    >
      <div className={styles.courseThumb}>
        {en.thumbnailUrl ? (
          <img className={styles.courseImg} src={en.thumbnailUrl} alt={en.courseName} />
        ) : (
          <div className={styles.courseImgFallback}>
            <i className="fas fa-play-circle" />
          </div>
        )}
        <span
          className={`${styles.statusBadge} ${
            completed ? styles.statusCompleted : styles.statusActive
          }`}
        >
          {completed ? "Hoàn thành" : "Đang học"}
        </span>
      </div>

      <div className={styles.courseInfo}>
        {/* Luôn render để mọi thẻ giữ đúng khung cao bằng nhau */}
        <div className={styles.courseCat}>{en.categoryName || "Khóa học"}</div>
        <div className={styles.courseName} title={en.courseName}>
          {en.courseName}
        </div>
        <div className={styles.courseMeta}>
          <i className="fas fa-clock" /> {en.durationHours} giờ
        </div>

        <div className={styles.progressRow}>
          <div className={styles.progressTop}>
            <span>{pct}%</span>
            <span className={styles.progressCount}>
              {en.completedMaterials}/{en.totalMaterials} học liệu
            </span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến độ ${pct}%, ${en.completedMaterials}/${en.totalMaterials} học liệu`}
          >
            <div
              className={`${styles.progressFill} ${completed ? styles.progressFillDone : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
