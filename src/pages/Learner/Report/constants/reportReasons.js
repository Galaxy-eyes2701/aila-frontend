// Nhãn tiếng Việt cho ReportType (spec UC-33 mục 6). Submit gửi số `value`,
// hiển thị nhãn tiếng Việt tương ứng.
export const REPORT_REASON_LABELS = {
  1: "Nội dung không phù hợp",
  2: "Ngôn từ thù ghét",
  3: "Bạo lực",
  4: "Nội dung tình dục",
  5: "Spam/Quảng cáo",
  6: "Vi phạm bản quyền",
  7: "Thông tin sai lệch",
  8: "Khác",
};

/** Lấy nhãn hiển thị cho một ReportReasonDto ({ id, name }). */
export function reasonLabel(reason) {
  // API trả về `id` (1..8); giữ fallback `value` cho tương thích cũ.
  return REPORT_REASON_LABELS[reason.id ?? reason.value] || reason.name;
}

export const DESCRIPTION_MAX = 1000;
