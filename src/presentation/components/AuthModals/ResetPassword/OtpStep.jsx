import { useEffect, useRef, useState } from 'react';
import shared from '../AuthModals.module.css';
import styles from './ResetPassword.module.css';
import { requestPasswordReset, verifyPasswordResetOtp, RESET_ERROR } from "@services/authApi";
import {
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  SPAM_HINT_AFTER_SECONDS,
  FALLBACK_OTP_TTL_SECONDS,
  FALLBACK_TOKEN_TTL_SECONDS,
} from './constants';
import useCountdown, { formatMmSs } from './useCountdown';

const EMPTY_OTP = Array(OTP_LENGTH).fill('');

/** a***@domain.com — đủ để người dùng nhận ra mình gõ đúng email nào. */
function maskEmail(email) {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  return `${email[0]}***${email.slice(at)}`;
}

/** S2 — Nhập mã OTP 6 số. */
export default function OtpStep({
  email,
  otpDeadline,
  onVerified,
  onResent,
  onChangeEmail,
}) {
  const [digits, setDigits] = useState(EMPTY_OTP);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [showSpamHint, setShowSpamHint] = useState(false);
  const boxRefs = useRef([]);

  const secondsLeft = useCountdown(otpDeadline);
  const expired = Boolean(otpDeadline) && secondsLeft <= 0;
  const cooldownLeft = useCountdown(cooldownUntil);

  const focusBox = (index) => boxRefs.current[index]?.focus();

  const resetBoxes = () => {
    setDigits(EMPTY_OTP);
    focusBox(0);
  };

  // Mỗi lần có mã mới (vào bước này hoặc gửi lại): xoá ô, khoá nút gửi lại,
  // và hẹn giờ hiện gợi ý hộp thư rác.
  useEffect(() => {
    if (!otpDeadline) return undefined;
    setDigits(EMPTY_OTP);
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    setShowSpamHint(false);
    focusBox(0);
    const id = setTimeout(() => setShowSpamHint(true), SPAM_HINT_AFTER_SECONDS * 1000);
    return () => clearTimeout(id);
  }, [otpDeadline]);

  const handleDigitChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setError('');
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) focusBox(index + 1);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setError('');
      setDigits((prev) => {
        const next = [...prev];
        if (next[index]) next[index] = '';
        else if (index > 0) next[index - 1] = '';
        return next;
      });
      if (!digits[index] && index > 0) focusBox(index - 1);
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  // Cho phép paste: chặn paste là chống người dùng, không chống được kẻ tấn công.
  const handlePaste = (index, e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    setError('');
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length && index + i < OTP_LENGTH; i += 1) {
        next[index + i] = pasted[i];
      }
      return next;
    });
    focusBox(Math.min(index + pasted.length, OTP_LENGTH - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || expired) return;

    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await verifyPasswordResetOtp(email, otp);
      onVerified(data?.resetToken, data?.expiresInSeconds || FALLBACK_TOKEN_TTL_SECONDS);
    } catch (err) {
      if (err.errorCode === RESET_ERROR.INVALID_OTP) {
        // Không biết mã sai, hết hạn hay đã bị huỷ do nhập sai quá số lần —
        // BE cố tình không nói. Luôn giữ lối thoát "Gửi lại mã".
        resetBoxes();
      }
      setError(err.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldownLeft > 0) return;
    setResending(true);
    setError('');
    try {
      const data = await requestPasswordReset(email);
      onResent(data?.otpExpiresInSeconds || FALLBACK_OTP_TTL_SECONDS);
    } catch (err) {
      if (err.errorCode === RESET_ERROR.RATE_LIMIT) {
        setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      }
      setError(err.errorMessage);
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = resending || cooldownLeft > 0;
  const resendLabel = resending
    ? 'Đang gửi...'
    : cooldownLeft > 0
      ? `Gửi lại mã sau ${cooldownLeft}s`
      : 'Gửi lại mã';

  return (
    <form className={shared.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.sentTo}>
        Mã xác thực đã được gửi tới <strong>{maskEmail(email)}</strong>
      </p>

      <div className={shared.inputGroup}>
        <label htmlFor="reset-otp-0">Mã xác thực (6 chữ số)</label>
        <div className={styles.otpBoxes}>
          {digits.map((digit, index) => (
            <input
              // Sáu ô cố định, không sắp xếp lại — index là khoá hợp lệ ở đây.
              key={index}
              id={`reset-otp-${index}`}
              ref={(el) => { boxRefs.current[index] = el; }}
              className={`${styles.otpBox} ${digit ? styles.otpBoxFilled : ''}`}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.target.select()}
              disabled={loading || expired}
              aria-label={`Chữ số thứ ${index + 1}`}
              aria-describedby="reset-otp-status"
            />
          ))}
        </div>
      </div>

      <p id="reset-otp-status" className={styles.countdown} aria-live="polite">
        {expired ? (
          <span className={styles.countdownExpired}>
            <i className="fas fa-clock" /> Mã đã hết hạn
          </span>
        ) : (
          <>
            <i className="fas fa-clock" /> Mã có hiệu lực trong{' '}
            <strong>{formatMmSs(secondsLeft)}</strong>
          </>
        )}
      </p>

      {error && (
        <div className={shared.errorMsg} role="alert">
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}

      {!expired && (
        <button
          type="submit"
          className={shared.btnSubmit}
          disabled={loading}
          aria-busy={loading}
        >
          {loading && <span className={shared.spinner} />}
          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>
      )}

      {/* Hết giờ thì "Gửi lại mã" trở thành hành động chính. */}
      <button
        type="button"
        className={expired ? shared.btnSubmit : styles.btnSecondary}
        onClick={handleResend}
        disabled={resendDisabled}
        aria-busy={resending}
      >
        {resending && <span className={expired ? shared.spinner : styles.spinnerDark} />}
        {resendLabel}
      </button>

      {showSpamHint && !expired && (
        <p className={styles.hintMsg}>
          <i className="fas fa-inbox" /> Chưa nhận được mã? Hãy kiểm tra cả hộp thư rác (spam).
        </p>
      )}

      <button type="button" className={styles.textBtn} onClick={onChangeEmail}>
        Đổi email khác
      </button>
    </form>
  );
}
