/** Các bước của máy trạng thái reset password (spec mục 2). */
export const RESET_STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  PASSWORD: 'password',
};

/**
 * Cooldown nút "Gửi lại mã". BE cho tối đa 5 lần/email/giờ nên client phải tự ghìm,
 * nếu không user bấm 5 phát là hết quota cả tiếng.
 */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Số ô nhập OTP. */
export const OTP_LENGTH = 6;

/** Policy đã chốt: chỉ yêu cầu độ dài tối thiểu, không thêm luật nào khác. */
export const MIN_PASSWORD_LENGTH = 8;

/** Sau chừng này giây kể từ lúc gửi mã thì gợi ý "kiểm tra hộp thư rác" (EDGE-U13). */
export const SPAM_HINT_AFTER_SECONDS = 30;

/** TTL dự phòng khi response thiếu trường thời hạn — giá trị thật luôn lấy từ response. */
export const FALLBACK_OTP_TTL_SECONDS = 300;
export const FALLBACK_TOKEN_TTL_SECONDS = 600;

export const SESSION_EXPIRED_MESSAGE =
  'Phiên đặt lại mật khẩu đã hết hạn, vui lòng thực hiện lại.';

export const RESET_SUCCESS_MESSAGE =
  'Đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.';
