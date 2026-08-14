import styles from "../LearningProfile.module.css";

export function BlockError({ message, onRetry }) {
  return (
    <div className={styles.blockState}>
      <div className={styles.blockIcon}>
        <i className="fas fa-triangle-exclamation" />
      </div>
      <p className={styles.blockTitle}>Không thể tải dữ liệu</p>
      <p className={styles.blockDesc}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          <i className="fas fa-rotate-right" /> Thử lại
        </button>
      )}
    </div>
  );
}

export function BlockEmpty({ icon = "fa-inbox", title, desc, primary }) {
  return (
    <div className={styles.blockState}>
      <div className={`${styles.blockIcon} ${primary ? styles.blockIconPrimary : ""}`}>
        <i className={`fas ${icon}`} />
      </div>
      <p className={styles.blockTitle}>{title}</p>
      {desc && <p className={styles.blockDesc}>{desc}</p>}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className={styles.courseGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}
