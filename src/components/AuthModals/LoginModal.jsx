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
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
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
