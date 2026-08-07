import { useState } from "react";
import { DIFFICULTY_LABEL } from "../../constants/expertEvaluation";
import styles from "./ScenarioPanel.module.css";

/**
 * Bối cảnh bài thực hành + bảng tiêu chí chấm (read-only).
 * Dùng chung UC-30 (mặc định thu gọn) và UC-63 detail (mặc định mở).
 */
export default function ScenarioPanel({ attempt, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (!attempt) return null;

  const criteria = attempt.scoringCriteria ?? [];
  const difficulty = DIFFICULTY_LABEL[attempt.difficulty];

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className={styles.headerTitle}>
          <i className="fas fa-clipboard-list" aria-hidden="true" />
          Bối cảnh &amp; tiêu chí chấm
        </span>
        <span className={styles.headerRight}>
          {difficulty && (
            <span
              className={`${styles.difficulty} ${styles[attempt.difficulty] ?? ""}`}
            >
              Độ khó: {difficulty}
            </span>
          )}
          <i
            className={`fas ${collapsed ? "fa-chevron-down" : "fa-chevron-up"}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          <Block
            icon="fa-book-open"
            title="Bối cảnh"
            content={attempt.scenario}
          />
          <Block
            icon="fa-user-graduate"
            title="Nhiệm vụ của học viên"
            content={attempt.learnerTask}
          />
          <Block icon="fa-robot" title="Nhiệm vụ của AI" content={attempt.aiTask} />

          {criteria.length > 0 && (
            <div className={styles.criteriaWrap}>
              <h4 className={styles.criteriaTitle}>
                <i className="fas fa-list-check" aria-hidden="true" /> Tiêu chí chấm
              </h4>
              <div className={styles.tableScroll}>
                <table className={styles.criteriaTable}>
                  <thead>
                    <tr>
                      <th scope="col">Tiêu chí</th>
                      <th scope="col">Mô tả</th>
                      <th scope="col" className={styles.weightCol}>
                        Trọng số
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Backend đã sắp theo weight giảm dần — giữ nguyên thứ tự trả về. */}
                    {criteria.map((c) => (
                      <tr key={c.id}>
                        <td className={styles.criterionTitle}>{c.title}</td>
                        <td className={styles.criterionDesc}>
                          {c.description?.trim() ? c.description : "—"}
                        </td>
                        <td className={styles.weightCol}>
                          <span className={styles.weightPill}>{c.weight}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Block({ icon, title, content }) {
  if (!content?.trim()) return null;
  return (
    <div className={styles.block}>
      <h4 className={styles.blockTitle}>
        <i className={`fas ${icon}`} aria-hidden="true" /> {title}
      </h4>
      <p className={styles.blockText}>{content}</p>
    </div>
  );
}
