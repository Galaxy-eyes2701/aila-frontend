/** Format ISO UTC → giờ local dạng dd/MM/yyyy HH:mm. */
export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Điểm 0–100 → số nguyên, null → "—". */
export function formatScore(score) {
  if (score == null) return "—";
  return Math.round(score);
}
