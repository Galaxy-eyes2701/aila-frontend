import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@services/api';
import useAuth from '@state/hooks/useAuth';
import ResetPasswordFlow from '@presentation/components/AuthModals/ResetPassword/ResetPasswordFlow';
import { RESET_SUCCESS_MESSAGE } from '@presentation/components/AuthModals/ResetPassword/constants';
import styles from './ExpertLogin.module.css';

const PANELS = { LOGIN: 'login', RESET: 'reset' };

export default function ExpertLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [panel, setPanel]     = useState(PANELS.LOGIN);
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── QUÊN MẬT KHẨU ── */
  const openReset = () => {
    setPanel(PANELS.RESET);
    setError('');
    setSuccess('');
  };

  const backToLogin = () => {
    setPanel(PANELS.LOGIN);
    setError('');
  };

  /** Đổi mật khẩu xong: về form đăng nhập, điền sẵn email để đăng nhập ngay. */
  const handleResetDone = (email) => {
    setPanel(PANELS.LOGIN);
    setForm({ email, password: '' });
    setError('');
    setSuccess(RESET_SUCCESS_MESSAGE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/expert/login', {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      }, { skipAuth: true });

      if (res.data.success) {
        const data = res.data.data;
        login(data.accessToken, {
          userId:   data.userId,
          fullName: data.fullName,
          email:    data.email,
          role:     data.role,
        });
        navigate('/expert');
      } else {
        setError(res.data.errorMessage || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      const apiMsg = err.response?.data?.errorMessage || err.response?.data?.message;
      setError(apiMsg || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (panel === PANELS.RESET) {
    return (
      <div className={styles.page}>
        <div className={`${styles.card} ${styles.cardFlush}`}>
          <ResetPasswordFlow
            initialEmail={form.email}
            onBackToLogin={backToLogin}
            onDone={handleResetDone}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <i className="fas fa-chalkboard-teacher" />
        </div>

        <h2 className={styles.title}>Đăng nhập cho Chuyên gia</h2>
        <p className={styles.subtitle}>
          Chào mừng trở lại! Nhập email và mật khẩu để vào khu vực chuyên gia.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Thông báo đổi mật khẩu thành công */}
          {success && (
            <div className={styles.success} role="alert">
              <i className="fas fa-circle-check" />
              {success}
            </div>
          )}

          {/* Email */}
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <i className={`fas fa-envelope ${styles.inputIcon}`} />
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="expert@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <i className={`fas fa-lock ${styles.inputIcon}`} />
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className={styles.input}
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: 14, padding: 0,
                }}
                tabIndex={-1}
              >
                <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          {/* Quên mật khẩu */}
          <div className={styles.forgotRow}>
            <button type="button" className={styles.forgotLink} onClick={openReset}>
              Quên mật khẩu?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <i className="fas fa-exclamation-circle" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading
              ? <><span className={styles.spinner} /> Đang xác thực...</>
              : <><i className="fas fa-sign-in-alt" /> Đăng nhập</>}
          </button>
        </form>

        
      </div>
    </div>
  );
}
