import styles from "../ModuleManagement.module.css";

export default function ModuleSkeleton() {
  return (
    <div className={styles.moduleStack}>
      {[0, 1, 2].map((item) => (
        <div className={styles.skeletonItem} key={item}>
          <div className={styles.skeletonOrder} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonLineWide} />
            <div className={styles.skeletonLine} />
          </div>
          <div className={styles.skeletonActions} />
        </div>
      ))}
    </div>
  );
}
