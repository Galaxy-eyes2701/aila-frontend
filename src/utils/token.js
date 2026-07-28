/**
 * Tiện ích đọc access token trong localStorage.
 * Dùng cho các luồng cần biết "đã đăng nhập thật sự chưa" trước khi gọi API
 * (ví dụ nút Mua ngay ở trang gói đăng ký — token hết hạn phải xử lý y như chưa đăng nhập).
 */

const CLOCK_SKEW_SECONDS = 30;

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeTokenPayload(token) {
  try {
    const payload = String(token ?? '').split('.')[1];
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

/** Token thiếu claim `exp` được coi là chưa hết hạn (không đủ dữ liệu để kết luận). */
export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now() + CLOCK_SKEW_SECONDS * 1000;
}

/** true khi có token và token chưa hết hạn. */
export function hasValidSession() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  return !isTokenExpired(token);
}
