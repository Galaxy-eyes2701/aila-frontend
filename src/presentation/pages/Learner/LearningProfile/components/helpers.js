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

/** Bỏ dấu + thường hóa để gõ "kiem tra" vẫn khớp "Kiểm tra". */
export function normalizeText(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // dấu thanh/dấu mũ rời ra sau khi NFD
    .replace(/đ/gi, "d") // đ không tách được bằng NFD
    .toLowerCase()
    .trim();
}

/** true nếu từ khóa rỗng, hoặc khớp bất kỳ trường nào trong `fields`. */
export function matchesKeyword(keyword, ...fields) {
  const needle = normalizeText(keyword);
  if (!needle) return true;
  return fields.some((f) => normalizeText(f).includes(needle));
}
