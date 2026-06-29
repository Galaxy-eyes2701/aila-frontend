import { useState } from 'react';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import styles from './AuthModals.module.css';

const PANELS = { LOGIN: 'login', FORGOT: 'forgot', RESET: 'reset' };

export default function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth();
  const [panel, setPanel]         = useState(PANELS.LOGIN);
  const [form, setForm]           = useState({ email: '', password: '', forgotEmail: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
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
      const res = await api.post('/auth/learner/login', {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.success) {
        const d = res.data.data;
        login(d.accessToken, { userId: d.userId, fullName: d.fullName, email: d.email, role: d.role });
        onLoginSuccess?.(d);
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
    // Redirect sang Google OAuth — backend xử lý callback
    window.location.href = 'https://localhost:7124/api/auth/learner/google';
  };

  /* ── FORGOT PASSWORD ── */
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!form.forgotEmail.trim()) { setError('Vui lòng nhập email.'); return; }
    setLoading(true); setError('');
    try {
      // Gửi yêu cầu reset — endpoint tuỳ backend
      await api.post('/auth/forgot-password', { email: form.forgotEmail.trim() });
      setPanel(PANELS.RESET);
    } catch {
      setError('Email không tồn tại trong hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <i className="fas fa-times" />
        </button>

        {/* ── HEADER ── */}
        <div className={styles.modalHeader}>
          {panel !== PANELS.LOGIN && (
            <button className={styles.backLink} onClick={() => { setPanel(PANELS.LOGIN); setError(''); }}>
              <i className="fas fa-arrow-left" /> Quay lại
            </button>
          )}
          <h2>
            {panel === PANELS.LOGIN  && 'Đăng nhập hệ thống'}
            {panel === PANELS.FORGOT && 'Quên mật khẩu'}
            {panel === PANELS.RESET  && 'Đặt lại mật khẩu'}
          </h2>
          <p>
            {panel === PANELS.LOGIN  && 'Chào mừng bạn trở lại!'}
            {panel === PANELS.FORGOT && 'Nhập email để nhận mã xác thực.'}
            {panel === PANELS.RESET  && 'Nhập mã OTP đã gửi đến email của bạn.'}
          </p>
        </div>

        <div className={styles.modalBody}>
          {/* ── LOGIN PANEL ── */}
          {panel === PANELS.LOGIN && (
            <form className={styles.form} onSubmit={handleLogin} noValidate>
              <div className={styles.inputGroup}>
                <label>Email</label>
                <div className={styles.inputWrapper}>
                  <i className="fas fa-envelope" />
                  <input name="email" type="email" placeholder="Nhập email của bạn"
                    value={form.email} onChange={handleChange} autoFocus />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <i className="fas fa-lock" />
                  <input name="password" type={showPwd ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                    <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className={styles.authExtras}>
                <label className={styles.rememberMe}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Ghi nhớ
                </label>
                <button type="button" className={styles.forgotLink}
                  onClick={() => { setPanel(PANELS.FORGOT); setError(''); }}>
                  Quên mật khẩu?
                </button>
              </div>

              {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle" />{error}</div>}

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
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
          )}

          {/* ── FORGOT PANEL ── */}
          {panel === PANELS.FORGOT && (
            <form className={styles.form} onSubmit={handleForgot} noValidate>
              <div className={styles.inputGroup}>
                <label>Email đã đăng ký</label>
                <div className={styles.inputWrapper}>
                  <i className="fas fa-envelope" />
                  <input name="forgotEmail" type="email" placeholder="Nhập email của bạn"
                    value={form.forgotEmail} onChange={handleChange} autoFocus />
                </div>
              </div>
              {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle" />{error}</div>}
              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> Đang gửi...</> : 'Gửi mã xác thực'}
              </button>
            </form>
          )}

          {/* ── RESET PANEL ── */}
          {panel === PANELS.RESET && (
            <form className={styles.form} onSubmit={e => e.preventDefault()} noValidate>
              <div className={styles.inputGroup}>
                <label>Mã xác thực (OTP)</label>
                <div className={styles.inputWrapper}>
                  <i className="fas fa-key" />
                  <input type="text" placeholder="Nhập mã OTP" autoFocus />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Mật khẩu mới</label>
                <div className={styles.inputWrapper}>
                  <i className="fas fa-lock" />
                  <input type="password" placeholder="Tối thiểu 8 ký tự" />
                </div>
              </div>
              <button type="submit" className={styles.btnSubmit}>Đặt lại mật khẩu</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
