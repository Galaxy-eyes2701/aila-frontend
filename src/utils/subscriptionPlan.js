/**
 * Hằng số & helper định dạng dùng chung cho gói đăng ký (UC-09, UC-90, UC-91, UC-92).
 * Quy ước hiển thị bám theo §0.5 của đặc tả UI.
 */

/** Giới hạn int32 của backend — chặn ở client để không chạm model binding error của ASP.NET. */
export const INT32_MAX = 2147483647;

/** decimal(18,2): tối đa 16 chữ số ở phần nguyên. */
export const PRICE_MAX_INTEGER_DIGITS = 16;

// ⚠️ Hệ thống chưa lưu currency ở đâu cả — VND là suy luận từ ngữ cảnh, cần BA xác nhận.
const priceFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('vi-VN');

export function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return priceFormatter.format(num);
}

export function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return numberFormatter.format(num);
}

/** Hiển thị thô theo ngày — không tự quy đổi sang tháng khi BA chưa chốt quy tắc. */
export function formatDuration(days) {
  const num = Number(days);
  if (!Number.isFinite(num)) return '—';
  return `${numberFormatter.format(num)} ngày`;
}

/**
 * `0` là giá trị hợp lệ và khác hẳn "không giới hạn" → hiển thị "Không bao gồm".
 * (đề xuất trong đặc tả, chờ BA chốt)
 */
export function formatLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (num === 0) return 'Không bao gồm';
  return numberFormatter.format(num);
}

/** ISO 8601 UTC → `dd/MM/yyyy HH:mm` theo giờ local. */
export function formatDateTime(value) {
  if (!value) return '—';

  // Chuỗi không kèm thông tin timezone vẫn phải được hiểu là UTC (§0.3).
  const raw = String(value);
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}Z`;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '—';

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const PLAN_STATUS_LABEL = {
  Active: 'Đang bán',
  Inactive: 'Ngừng bán',
};

/** Hai case 404 (không tồn tại / đã ngừng bán) hiển thị như nhau để không lộ gói Inactive. */
export const PLAN_UNAVAILABLE_MESSAGE = 'Gói đăng ký này hiện không còn được bán.';
