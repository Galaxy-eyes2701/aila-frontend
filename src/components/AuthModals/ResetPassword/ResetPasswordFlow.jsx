import { useCallback, useState } from 'react';
import shared from '../AuthModals.module.css';
import styles from './ResetPassword.module.css';
import EmailStep from './EmailStep';
import OtpStep from './OtpStep';
import PasswordStep from './PasswordStep';
import { RESET_STEPS, SESSION_EXPIRED_MESSAGE } from './constants';

const STEP_META = {
  [RESET_STEPS.EMAIL]: {
    order: 1,
    title: 'Quên mật khẩu',
    subtitle: 'Nhập email đã đăng ký để nhận mã xác thực.',
  },
  [RESET_STEPS.OTP]: {
    order: 2,
    title: 'Xác thực email',
    subtitle: 'Nhập mã 6 chữ số vừa được gửi tới email của bạn.',
  },
  [RESET_STEPS.PASSWORD]: {
    order: 3,
    title: 'Đặt mật khẩu mới',
    subtitle: 'Chọn mật khẩu mới cho tài khoản của bạn.',
  },
};

const TOTAL_STEPS = Object.keys(STEP_META).length;

/**
 * Máy trạng thái 3 bước của luồng reset password (UC-08).
 *
 * `resetToken` chỉ nằm trong React state (memory): cấm localStorage/sessionStorage/
 * cookie/query string — token này tương đương quyền đổi mật khẩu tài khoản.
 * Hệ quả có chủ ý: reload trang là mất hết state và phải làm lại từ bước 1.
 */
export default function ResetPasswordFlow({ initialEmail = '', onBackToLogin, onDone }) {
  const [step, setStep] = useState(RESET_STEPS.EMAIL);
  const [email, setEmail] = useState(initialEmail);
  const [otpDeadline, setOtpDeadline] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [tokenDeadline, setTokenDeadline] = useState(null);
  const [notice, setNotice] = useState('');

  const deadlineFrom = (seconds) => Date.now() + seconds * 1000;

  const handleSent = (sentEmail, ttlSeconds) => {
    setEmail(sentEmail);
    setOtpDeadline(deadlineFrom(ttlSeconds));
    setNotice('');
    setStep(RESET_STEPS.OTP);
  };

  const handleResent = (ttlSeconds) => setOtpDeadline(deadlineFrom(ttlSeconds));

  const handleVerified = (token, ttlSeconds) => {
    setResetToken(token);
    setTokenDeadline(deadlineFrom(ttlSeconds));
    setOtpDeadline(null);
    setStep(RESET_STEPS.PASSWORD);
  };

  /** Quay về bước 1, xoá sạch token và các đồng hồ. */
  const backToEmailStep = useCallback((message = '') => {
    setResetToken(null);
    setTokenDeadline(null);
    setOtpDeadline(null);
    setNotice(message);
    setStep(RESET_STEPS.EMAIL);
  }, []);

  const handleSessionExpired = useCallback(
    () => backToEmailStep(SESSION_EXPIRED_MESSAGE),
    [backToEmailStep]
  );

  const handleSuccess = () => {
    setResetToken(null);
    setTokenDeadline(null);
    onDone(email);
  };

  const meta = STEP_META[step];

  return (
    <>
      <div className={shared.modalHeader}>
        <button className={shared.backLink} type="button" onClick={onBackToLogin}>
          <i className="fas fa-arrow-left" /> Quay lại đăng nhập
        </button>
        <span className={styles.stepBadge}>
          Bước {meta.order}/{TOTAL_STEPS}
        </span>
        <h2>{meta.title}</h2>
        <p>{meta.subtitle}</p>
      </div>

      <div className={shared.modalBody}>
        {step === RESET_STEPS.EMAIL && (
          <EmailStep initialEmail={email} notice={notice} onSent={handleSent} />
        )}

        {step === RESET_STEPS.OTP && (
          <OtpStep
            email={email}
            otpDeadline={otpDeadline}
            onVerified={handleVerified}
            onResent={handleResent}
            onChangeEmail={() => backToEmailStep()}
          />
        )}

        {step === RESET_STEPS.PASSWORD && (
          <PasswordStep
            resetToken={resetToken}
            tokenDeadline={tokenDeadline}
            onSuccess={handleSuccess}
            onSessionExpired={handleSessionExpired}
            onCancel={() => backToEmailStep()}
          />
        )}
      </div>
    </>
  );
}
