import styles from './LearningMaterial.module.css';

export default function LearningMaterialItem({
  material,
  index,
  totalMaterials,
  onMove,
  onEdit,
  onDelete,
}) {
  const type = material.materialTypeName ?? material.materialType ?? "";

  const icons = {
    Video:      "fa-circle-play",
    Document:   "fa-file-lines",
    Quiz:       "fa-circle-question",
    AiPractice: "fa-robot",
  };

  return (
    <div className={styles.item}>
      <div className={styles.left}>
        <div className={styles.orderColumn}>
          <div className={styles.orderControls}>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(material.id, -1)}
              title="Di chuyển lên"
            >
              <i className="fas fa-arrow-up" />
            </button>
            <button
              type="button"
              disabled={index === totalMaterials - 1}
              onClick={() => onMove(material.id, 1)}
              title="Di chuyển xuống"
            >
              <i className="fas fa-arrow-down" />
            </button>
          </div>
        </div>

        <i className={`fas ${icons[type] ?? "fa-file"}`} />
        <div>
          <div className={styles.title}>{material.title}</div>
          <div className={styles.type}>
            {type}
            {/* Hiện duration nếu là Video */}
            {material.durationSeconds > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                · {Math.floor(material.durationSeconds / 60)}:{String(material.durationSeconds % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} onClick={() => onEdit(material)}>
          <i className="fas fa-pen" />
        </button>
        <button
          className={`${styles.iconButton} ${styles.deleteButton}`}
          onClick={() => onDelete(material)}
        >
          <i className="fas fa-trash" />
        </button>
      </div>
    </div>
  );
}