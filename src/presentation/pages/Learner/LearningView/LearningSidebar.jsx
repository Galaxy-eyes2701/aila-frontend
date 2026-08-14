// LearningSidebar.jsx
import styles from "./LearningView.module.css";

function getMaterialIcon(type = "") {
  const materialType = type || '';
  
  if (materialType === 'Video') return "fa-play-circle";
  if (materialType === 'Quiz') return "fa-vial";
  if (materialType === 'AiPractice') return "fa-robot";
  if (materialType === 'Document') return "fa-file-pdf";
  
  // Fallback for legacy string-based checks
  const t = materialType.toLowerCase();
  if (t.includes("video")) return "fa-play-circle";
  if (t.includes("pdf") || t.includes("document")) return "fa-file-pdf";
  if (t.includes("quiz") || t.includes("test")) return "fa-vial";
  if (t.includes("ai") || t.includes("practice")) return "fa-robot";
  
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
                  Học phần {mod.orderIndex}: {mod.title}
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
