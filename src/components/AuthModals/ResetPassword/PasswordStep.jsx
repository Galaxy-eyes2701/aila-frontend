import { useState } from 'react';
import shared from '../AuthModals.module.css';
import styles from './ResetPassword.module.css';
import { confirmPasswordReset, RESET_ERROR } from '../services/authApi';
import { MIN_PASSWORD_LENGTH } from './constants';
import useCountdown, { formatMmSs } from './useCountdown';

/** S3 — Đặt mật khẩu mới. */
export default function PasswordStep({
  resetToken,
  tokenDeadline,
  onSuccess,
  onSessionExpired,
  onCancel,
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hết giờ thì báo ngay, không để người dùng gõ xong mật khẩu rồi mới báo hỏng.
  const secondsLeft = useCountdown(tokenDeadline, onSessionExpired);

  const clearErrors = () => {
    setPasswordError('');
    setConfirmError('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate đúng bằng backend: chỉ độ dài và hai ô khớp nhau.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setConfirmError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    clearErrors();
    try {
      await confirmPasswordReset(resetToken, password, confirm);
      onSuccess();
    } catch (err) {
      if (err.errorCode === RESET_ERROR.INVALID_TOKEN) {
        // Token hết hạn hoặc đã dùng — bắt buộc làm lại từ đầu.
        onSessionExpired();
        return;
      }
      if (err.errorCode === RESET_ERROR.INVALID_PASSWORD || err.errorCode === RESET_ERROR.VALIDATION) {
        // BE không tiêu thụ token khi password sai policy → sửa và submit lại được ngay.
        setPasswordError(err.errorMessage);
        return;
      }
      if (err.errorCode === RESET_ERROR.PASSWORD_REUSED) {
        setPasswordError(err.errorMessage);
        return;
      }
      // 503 / lỗi mạng: giữ nguyên mật khẩu đã gõ và resetToken, cho bấm thử lại.
      setFormError(err.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={shared.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.countdown} aria-live="polite">
        <i className="fas fa-clock" /> Phiên đặt lại còn hiệu lực{' '}
        <strong>{formatMmSs(secondsLeft)}</strong>
      </p>

      <div className={shared.inputGroup}>
        <label htmlFor="reset-new-password">Mật khẩu mới</label>
        <div className={shared.inputWrapper}>
          <i className="fas fa-lock" />
          <input
            id="reset-new-password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
            aria-invalid={passwordError ? 'true' : undefined}
            aria-describedby={passwordError ? 'reset-new-password-error' : undefined}
            disabled={loading}
            autoFocus
          />
          <button
            type="button"
            className={shared.eyeBtn}
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        </div>
        {passwordError && (
          <span id="reset-new-password-error" className={styles.fieldError} role="alert">
            {passwordError}
          </span>
        )}
      </div>

      <div className={shared.inputGroup}>
        <label htmlFor="reset-confirm-password">Xác nhận mật khẩu mới</label>
        <div className={shared.inputWrapper}>
          <i className="fas fa-lock" />
          <input
            id="reset-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); clearErrors(); }}
            aria-invalid={confirmError ? 'true' : undefined}
            aria-describedby={confirmError ? 'reset-confirm-password-error' : undefined}
            disabled={loading}
          />
          <button
            type="button"
            className={shared.eyeBtn}
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        </div>
        {confirmError && (
          <span id="reset-confirm-password-error" className={styles.fieldError} role="alert">
            {confirmError}
          </span>
        )}
      </div>

      {formError && (
        <div className={shared.errorMsg} role="alert">
          <i className="fas fa-exclamation-circle" />
          {formError}
        </div>
      )}

      <button type="submit" className={shared.btnSubmit} disabled={loading} aria-busy={loading}>
        {loading && <span className={shared.spinner} />}
        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
      </button>

      {/* Không có nút quay lại bước OTP: mã đã bị BE xoá sau khi verify, quay lại là ngõ cụt. */}
      <button type="button" className={styles.textBtn} onClick={onCancel}>
        Huỷ
      </button>
    </form>
  );
}
