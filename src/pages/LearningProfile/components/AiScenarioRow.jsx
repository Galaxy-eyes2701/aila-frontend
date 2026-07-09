import { formatDateTime, formatScore } from "./helpers";
import styles from "../LearningProfile.module.css";

/** Một dòng lịch sử AI scenario (hiện API trả []; component sẵn cho tương lai). */
export default function AiScenarioRow({ item }) {
  return (
    <div className={styles.aiRow}>
      <div>
        <div className={styles.aiName}>{item.scenarioName}</div>
        <div className={styles.aiDate}>
          <i className="fas fa-clock" /> {formatDateTime(item.performedAt)}
        </div>
      </div>
      <div className={styles.aiScore}>
        {item.score == null ? "—" : `${formatScore(item.score)}/100`}
      </div>
    </div>
  );
}
