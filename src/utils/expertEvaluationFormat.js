import {
  DELETED_MATERIAL_TITLE,
  EVALUATION_LIMITS,
} from "../constants/expertEvaluation";

const { MAX_SCORE } = EVALUATION_LIMITS;

/**
 * Quy tắc hiển thị chung (§8 spec): server trả UTC ISO-8601,
 * UI hiển thị theo giờ địa phương `dd/MM/yyyy HH:mm`.
 */

const RELATIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `dd/MM/yyyy HH:mm` theo giờ địa phương. Trả "—" khi không có giá trị. */
export function formatDateTime(value, fallback = "—") {
  const date = parseDate(value);
  if (!date) return fallback;

  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Mốc dưới 7 ngày hiển thị tương đối ("2 giờ trước"),
 * xa hơn thì rơi về ngày giờ đầy đủ.
 */
export function formatRelativeTime(value, fallback = "—") {
  const date = parseDate(value);
  if (!date) return fallback;

  const diff = Date.now() - date.getTime();
  if (diff < 0 || diff >= RELATIVE_THRESHOLD_MS) return formatDateTime(value, fallback);

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  return `${Math.floor(hours / 24)} ngày trước`;
}

/**
 * Điểm AI (`finalScore`) và điểm chuyên gia (`overallScore`) dùng chung thang 0–100,
 * nên chung một hàm format. Hậu tố lấy từ `MAX_SCORE` thay vì hardcode.
 */
export function formatScore(score, fallback = "—") {
  const text = formatScoreValue(score);
  return text === null ? fallback : `${text}/${MAX_SCORE}`;
}

/** Phần số của điểm, không kèm hậu tố. Trả null khi không có điểm. */
function formatScoreValue(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return null;
  }
  // 87 -> "87"; 87.5 -> "87.5"; 87.25 -> "87.25"
  return String(Math.round(Number(score) * 100) / 100);
}

/** Học liệu đã bị xóa -> backend trả title rỗng; không để trống trên UI. */
export function resolveMaterialTitle(title) {
  return title?.trim() ? title : DELETED_MATERIAL_TITLE;
}

/**
 * Câu so sánh điểm chuyên gia với điểm AI (§5.3).
 * Trả `null` khi thiếu một trong hai điểm.
 */
export function buildScoreComparison(expertScore, aiScore) {
  if (expertScore === null || expertScore === undefined) return null;
  if (aiScore === null || aiScore === undefined) return null;

  const diff = Math.round((Number(expertScore) - Number(aiScore)) * 100) / 100;
  if (diff === 0) return "Chuyên gia đồng quan điểm với AI";

  const direction = diff > 0 ? "cao hơn" : "thấp hơn";
  const gapText = formatScoreValue(Math.abs(diff));
  const expertText = formatScoreValue(expertScore);

  return `Chuyên gia chấm ${expertText} — ${direction} AI ${gapText} điểm`;
}
