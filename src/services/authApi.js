import api from '@services/api';

/** Lỗi API mang errorCode để UI rẽ nhánh theo bảng lỗi (spec mục 3.2). */
export class ApiError extends Error {
  constructor(errorCode, errorMessage, status) {
    super(errorMessage || errorCode || 'Đã xảy ra lỗi');
    this.name = 'ApiError';
    this.errorCode = errorCode || 'UNKNOWN';
    this.errorMessage = errorMessage || 'Đã xảy ra lỗi không xác định.';
    this.status = status;
  }
}

/**
 * `errorCode` là hợp đồng ổn định — điều hướng dựa trên mã này.
 * `errorMessage` là văn bản hiển thị, KHÔNG parse chuỗi để ra quyết định.
 */
export const RESET_ERROR = {
  VALIDATION: 'VALIDATION_ERROR',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  INVALID_OTP: 'INVALID_OR_EXPIRED_OTP',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  PASSWORD_REUSED: 'PASSWORD_REUSED',
  INVALID_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK: 'NETWORK_ERROR',
};

/* Ba endpoint dưới đây là public — không đính kèm Authorization header. */
const PUBLIC_REQ = { skipAuth: true };

async function request(promise) {
  let res;
  try {
    res = await promise;
  } catch (err) {
    const resp = err?.response;
    if (resp) {
      const body = resp.data || {};
      throw new ApiError(body.errorCode, body.errorMessage, resp.status);
    }
    // Timeout / mất mạng: UI xử lý y như 503 — giữ nguyên state, cho thử lại.
    throw new ApiError(
      RESET_ERROR.NETWORK,
      'Lỗi kết nối máy chủ. Vui lòng thử lại.',
      0
    );
  }

  const body = res.data;
  if (body && body.success) return body.data;
  throw new ApiError(body?.errorCode, body?.errorMessage, res.status);
}

/**
 * POST /api/auth/password-reset/request — xin mã OTP.
 * Response trung tính: không tiết lộ email có tồn tại hay không.
 * data: { message, otpExpiresInSeconds }
 */
export function requestPasswordReset(email) {
  return request(
    api.post('/auth/password-reset/request', { email: email.trim() }, PUBLIC_REQ)
  );
}

/**
 * POST /api/auth/password-reset/verify — đổi OTP lấy resetToken.
 * data: { resetToken, expiresInSeconds }
 */
export function verifyPasswordResetOtp(email, otp) {
  return request(
    api.post(
      '/auth/password-reset/verify',
      { email: email.trim(), otp: otp.replace(/\D/g, '') },
      PUBLIC_REQ
    )
  );
}

/**
 * POST /api/auth/password-reset/confirm — đặt mật khẩu mới.
 * BE chỉ tiêu thụ token khi thành công; sai policy password thì token còn dùng được.
 * data: null
 */
export function confirmPasswordReset(resetToken, newPassword, confirmPassword) {
  return request(
    api.post(
      '/auth/password-reset/confirm',
      { resetToken, newPassword, confirmPassword },
      PUBLIC_REQ
    )
  );
}
