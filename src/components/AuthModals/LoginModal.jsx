import { useState } from 'react';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import styles from './AuthModals.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ResetPasswordFlow from './ResetPassword/ResetPasswordFlow';
import { RESET_SUCCESS_MESSAGE } from './ResetPassword/constants';

const PANELS = { LOGIN: 'login', RESET: 'reset' };

export default function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [panel, setPanel]         = useState(PANELS.LOGIN);
  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [remember, setRemember]   = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

    /* ── LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await api.post('/learner/login', {  // ← đúng endpoint
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.success) {
        const d = res.data.data;
        login(d.accessToken, { userId: d.userId, fullName: d.fullName, email: d.email, role: d.role });
        onLoginSuccess?.(d);

        const from = location.state?.from?.pathname;
        if (from && from !== '/') {
          navigate(from, { replace: true });
        }
      } else {
        setError(res.data.errorMessage || 'Đăng nhập thất bại.');
      }
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  /* ── GOOGLE LOGIN ── */
  const handleGoogle = async () => {
    try {
      // Gọi backend lấy Google auth URL thay vì hardcode
      const returnUrl = window.location.origin;
      const res = await api.get(`/auth/google/url?returnUrl=${encodeURIComponent(returnUrl)}`);
      if (res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      }
    } catch {
      setError('Không thể kết nối Google. Vui lòng thử lại.');
    }
  };

  /* ── RESET PASSWORD ── */
  const openReset = () => {
    setPanel(PANELS.RESET);
    setError('');
    setSuccess('');
  };

  const backToLogin = () => {
    setPanel(PANELS.LOGIN);
    setError('');
  };

  /** Đổi mật khẩu xong: về panel đăng nhập, điền sẵn email để đăng nhập ngay. */
  const handleResetDone = (email) => {
    setPanel(PANELS.LOGIN);
    setForm({ email, password: '' });
    setError('');
    setSuccess(RESET_SUCCESS_MESSAGE);
  };

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <i className="fas fa-times" />
        </button>

        {panel === PANELS.RESET ? (
          <ResetPasswordFlow
            initialEmail={form.email}
            onBackToLogin={backToLogin}
            onDone={handleResetDone}
          />
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className={styles.modalHeader}>
              <h2>Đăng nhập hệ thống</h2>
              <p>Chào mừng bạn trở lại!</p>
            </div>

            <div className={styles.modalBody}>
              <form className={styles.form} onSubmit={handleLogin} noValidate>
                {success && (
                  <div className={styles.successMsg} role="alert">
                    <i className="fas fa-circle-check" />
                    {success}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label htmlFor="login-email">Email</label>
                  <div className={styles.inputWrapper}>
                    <i className="fas fa-envelope" />
                    <input id="login-email" name="email" type="email" placeholder="Nhập email của bạn"
                      value={form.email} onChange={handleChange} autoFocus />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="login-password">Mật khẩu</label>
                  <div className={styles.inputWrapper}>
                    <i className="fas fa-lock" />
                    <input id="login-password" name="password" type={showPwd ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)}
                      aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} tabIndex={-1}>
                      <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className={styles.authExtras}>
                  <label className={styles.rememberMe}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                    Ghi nhớ
                  </label>
                  <button type="button" className={styles.forgotLink} onClick={openReset}>
                    Quên mật khẩu?
                  </button>
                </div>

                {error && <div className={styles.errorMsg} role="alert"><i className="fas fa-exclamation-circle" />{error}</div>}

                <button type="submit" className={styles.btnSubmit} disabled={loading} aria-busy={loading}>
                  {loading ? <><span className={styles.spinner} /> Đang xử lý...</> : 'Đăng nhập'}
                </button>

                <div className={styles.divider}>Hoặc</div>

                <button type="button" className={styles.btnGoogle} onClick={handleGoogle}>
                  <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.6h146.9c-6.3 33.9-25.1 62.7-53.7 81.8v68h86.7c50.8-46.8 80.6-115.7 80.6-195z"/>
                    <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24.1 178.2-65.6l-86.7-68c-24.1 16.2-55 25.7-91.5 25.7-70.4 0-130-47.5-151.3-111.2H33.9v69.9C78.2 488.4 169.1 544.3 272 544.3z"/>
                    <path fill="#FBBC05" d="M120.7 323.2c-11.2-33.5-11.2-69.4 0-102.9V150.5H33.9c-37.7 73.9-37.7 161.4 0 235.3l86.8-62.6z"/>
                    <path fill="#EA4335" d="M272 107.7c39.6 0 75.2 13.6 103.3 40.2l77.4-77.4C406.7 25 347.7 0 272 0 169.1 0 78.2 55.9 33.9 150.5l86.8 69.8C142 155.2 201.6 107.7 272 107.7z"/>
                  </svg>
                  Đăng nhập bằng Google
                </button>

                <p className={styles.switchText}>
                  Chưa có tài khoản?{' '}
                  <button className={styles.switchLink} type="button" onClick={onSwitchToRegister}>
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
