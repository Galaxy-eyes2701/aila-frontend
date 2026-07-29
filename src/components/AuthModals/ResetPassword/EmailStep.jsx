import { useState } from 'react';
import shared from '../AuthModals.module.css';
import styles from './ResetPassword.module.css';
import { requestPasswordReset, RESET_ERROR } from '../services/authApi';
import { RESEND_COOLDOWN_SECONDS, FALLBACK_OTP_TTL_SECONDS } from './constants';
import useCountdown from './useCountdown';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** S1 — Nhập email để xin mã OTP. */
export default function EmailStep({ initialEmail = '', notice = '', onSent }) {
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);

  const lockLeft = useCountdown(lockedUntil);
  const locked = lockLeft > 0;

  const handleChange = (e) => {
    setEmail(e.target.value);
    setFieldError('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || locked) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Vui lòng nhập email.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Email không đúng định dạng.');
      return;
    }

    setLoading(true);
    setFieldError('');
    setFormError('');
    try {
      const data = await requestPasswordReset(trimmed);
      // Email không tồn tại cũng đi đúng nhánh này — BE trả response trung tính,
      // UI tuyệt đối không được suy ra hay hiển thị "email không tồn tại".
      onSent(trimmed, data?.otpExpiresInSeconds || FALLBACK_OTP_TTL_SECONDS);
    } catch (err) {
      if (err.errorCode === RESET_ERROR.RATE_LIMIT) {
        setLockedUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
        setFormError(err.errorMessage);
      } else if (
        err.errorCode === RESET_ERROR.INVALID_EMAIL_FORMAT ||
        err.errorCode === RESET_ERROR.VALIDATION
      ) {
        setFieldError(err.errorMessage);
      } else {
        // 503 / lỗi mạng: giữ nguyên bước, cho thử lại.
        setFormError(err.errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = locked
    ? `Gửi lại sau ${lockLeft}s`
    : loading
      ? 'Đang gửi...'
      : 'Gửi mã xác thực';

  return (
    <form className={shared.form} onSubmit={handleSubmit} noValidate>
      {notice && (
        <div className={styles.noticeMsg} role="alert">
          <i className="fas fa-circle-info" />
          {notice}
        </div>
      )}

      <div className={shared.inputGroup}>
        <label htmlFor="reset-email">Email đã đăng ký</label>
        <div className={shared.inputWrapper}>
          <i className="fas fa-envelope" />
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={handleChange}
            aria-invalid={fieldError ? 'true' : undefined}
            aria-describedby={fieldError ? 'reset-email-error' : undefined}
            disabled={loading}
            autoFocus
          />
        </div>
        {fieldError && (
          <span id="reset-email-error" className={styles.fieldError} role="alert">
            {fieldError}
          </span>
        )}
      </div>

      {formError && (
        <div className={shared.errorMsg} role="alert">
          <i className="fas fa-exclamation-circle" />
          {formError}
        </div>
      )}

      <button
        type="submit"
        className={shared.btnSubmit}
        disabled={loading || locked}
        aria-busy={loading}
      >
        {loading && <span className={shared.spinner} />}
        {submitLabel}
      </button>
    </form>
  );
}
