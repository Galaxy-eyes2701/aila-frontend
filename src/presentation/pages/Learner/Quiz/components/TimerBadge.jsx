import styles from "../Quiz.module.css";

function format(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Hiển thị thời gian còn lại. aria-live để screen reader đọc mốc quan trọng.
 */
export default function TimerBadge({ remainingMs }) {
  const totalSec = Math.floor(remainingMs / 1000);
  const cls =
    totalSec <= 30
      ? styles.timerDanger
      : totalSec <= 60
        ? styles.timerWarning
        : "";

  return (
    <div
      className={`${styles.timerBadge} ${cls}`}
      role="timer"
      aria-live={totalSec <= 60 ? "assertive" : "off"}
      aria-label={`Thời gian còn lại ${format(remainingMs)}`}
    >
      <i className="fas fa-clock" />
      <span>{format(remainingMs)}</span>
    </div>
  );
}
