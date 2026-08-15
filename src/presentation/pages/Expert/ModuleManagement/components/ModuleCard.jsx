import { useState } from "react";
import DOMPurify from "dompurify";
import styles from "../ModuleManagement.module.css";
import LearningMaterialList from "./LearningMaterial/LearningMaterialList";

export default function ModuleCard({
  module,
  index,
  totalModules,
  busy,
  actions,
}) {
  const [expanded, setExpanded] = useState(false);
  const [materialRefreshKey, setMaterialRefreshKey] = useState(0);

  const formatDate = (value) => {
    if (!value) return "Chưa cập nhật";

    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <article className={styles.moduleItem}>
      {/* LEFT */}

      <div className={styles.orderColumn}>
        <span>{String(index + 1).padStart(2, "0")}</span>

        <div className={styles.orderControls}>
          <button
            className={styles.iconButton}
            disabled={index === 0}
            onClick={() => actions.onMove(module.id, -1)}
          >
            <i className="fas fa-arrow-up" />
          </button>

          <button
            className={styles.iconButton}
            disabled={index === totalModules - 1}
            onClick={() => actions.onMove(module.id, 1)}
          >
            <i className="fas fa-arrow-down" />
          </button>
        </div>
      </div>

      {/* CENTER */}

      <div className={styles.moduleContent}>
        <div className={styles.moduleTitleRow}>
          <h3>{module.title}</h3>
        </div>

        {module.description ? (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(module.description),
            }}
          />
        ) : (
          <p className={styles.mutedDescription}>
            Chưa có mô tả cho học phần này.
          </p>
        )}

        <div className={styles.metaRow}>
          <span>
            <i className="fas fa-file-lines" /> {module.materialCount ?? 0} học
            liệu
          </span>

          <span>
            <i className="fas fa-calendar-plus" />{" "}
            {formatDate(module.createdAt)}
          </span>

          <span>
            <i className="fas fa-pen-to-square" />{" "}
            {formatDate(module.updatedAt)}
          </span>
        </div>

        {/* ---------- LEARNING MATERIAL ---------- */}

        <div className={styles.learningMaterialSection}>
          <button
            className={styles.expandButton}
            onClick={() => setExpanded(!expanded)}
          >
            <i
              className={`fas ${
                expanded ? "fa-chevron-down" : "fa-chevron-right"
              }`}
            />{" "}
            Tài liệu học tập
          </button>

          {expanded && (
            <div className={styles.learningMaterialContainer}>
              <LearningMaterialList
                moduleId={module.id}
                refreshKey={materialRefreshKey}
                onCreate={() => actions.onCreateMaterial(module)}
                onEdit={(material) =>
                  actions.onEditMaterial(material, () =>
                    setMaterialRefreshKey((k) => k + 1),
                  )
                }
                onDeleted={(success, message) =>
                  actions.onMaterialDeleted(success, message)
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}

      <div className={styles.actionGroup}>
        <button
          className={styles.secondaryButton}
          disabled={busy}
          onClick={() => actions.onEdit(module)}
        >
          <i className="fas fa-pen" />
          Sửa
        </button>

        <button
          className={styles.dangerButton}
          disabled={busy}
          onClick={() => actions.onDelete(module)}
        >
          <i className="fas fa-trash" />
          Xóa
        </button>
      </div>
    </article>
  );
}
