// LearningSidebar.jsx
import styles from "./LearningView.module.css";

function getMaterialIcon(type = "") {
  const t = type.toLowerCase();
  if (t.includes("video")) return "fa-play-circle";
  if (t.includes("pdf") || t.includes("document")) return "fa-file-pdf";
  if (t.includes("quiz") || t.includes("test")) return "fa-vial";
  return "fa-file-alt";
}

export default function LearningSidebar({
  modules = [],
  currentMaterialId,
  onSelectMaterial,
}) {
  const sortedModules = [...modules].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Nội dung khóa học</h3>
      <div className={styles.sectionList}>
        {sortedModules.map((mod) => {
          const sortedMaterials = [...(mod.materials || [])].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          return (
            <div key={mod.id} className={styles.sectionItem}>
              <div className={styles.sectionHeader}>
                <h4>
                  Chương {mod.orderIndex}: {mod.title}
                </h4>
              </div>
              <ul className={styles.materialList}>
                {sortedMaterials.map((m) => {
                  const isSelected = currentMaterialId === m.id;
                  return (
                    <li
                      key={m.id}
                      className={`${styles.materialItem} ${isSelected ? styles.activeMaterial : ""}`}
                      onClick={() => !isSelected && onSelectMaterial(m.id)}
                    >
                      <div className={styles.materialLeft}>
                        <i
                          className={`fas ${getMaterialIcon(m.type)} ${styles.typeIcon}`}
                        />
                        <span className={styles.mTitle}>
                          Bài {m.orderIndex}: {m.title}
                        </span>
                      </div>
                      {m.isCompleted && (
                        <div className={styles.checkIcon}>
                          <i className="fas fa-check-circle" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
