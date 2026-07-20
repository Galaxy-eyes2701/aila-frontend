import { useState } from 'react';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import styles from './AuthModals.module.css';

export default function RegisterModal({ onClose, onSwitchToLogin, onRegisterSuccess }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ fullName: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return; }
    if (!form.email.trim())    { setError('Vui lòng nhập email.'); return; }
    if (form.password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }

    setLoading(true); setError('');
    try {
      const registerRes = await api.post('/auth/register', {
        fullName: form.fullName.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!registerRes.data.success) {
        setError(registerRes.data.errorMessage || 'Đăng ký thất bại.');
        return;
      }

      const loginRes = await api.post('/learner/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (loginRes.data.success) {
        const d = loginRes.data.data;
        login(d.accessToken, {
          userId: d.userId,
          fullName: d.fullName,
          email: d.email,
          role: d.role,
        });
        onRegisterSuccess?.(d);
      } else {
        setError(loginRes.data.errorMessage || 'Đăng ký thành công nhưng đăng nhập tự động thất bại.');
      }
    } catch (err) {
      const msg = err.response?.data?.errorMessage;
      setError(msg || 'Email đã được sử dụng hoặc có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = 'https://localhost:7124/api/auth/learner/google';
  };

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <i className="fas fa-times" />
        </button>

        <div className={styles.modalHeader}>
          <h2>Tạo tài khoản mới</h2>
          <p>Bắt đầu hành trình học tập của bạn!</p>
        </div>

        <div className={styles.modalBody}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Họ tên */}
            <div className={styles.inputGroup}>
              <label>Họ và tên</label>
              <div className={styles.inputWrapper}>
                <i className="fas fa-id-card" />
                <input name="fullName" type="text" placeholder="Nhập họ và tên"
                  value={form.fullName} onChange={handleChange} autoFocus />
              </div>
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
              <label>Email</label>
              <div className={styles.inputWrapper}>
                <i className="fas fa-envelope" />
                <input name="email" type="email" placeholder="Nhập email"
                  value={form.email} onChange={handleChange} />
              </div>
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <label>Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <i className="fas fa-lock" />
                <input name="password" type={showPwd ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={handleChange} />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle" />{error}</div>}

            <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ marginTop: 6 }}>
              {loading
                ? <><span className={styles.spinner} /> Đang tạo tài khoản...</>
                : 'Đăng ký tài khoản'}
            </button>

            <div className={styles.divider}>Hoặc</div>

            <button type="button" className={styles.btnGoogle} onClick={handleGoogle}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              Đăng ký bằng Google
            </button>

            <p className={styles.switchText}>
              Đã có tài khoản?{' '}
              <button className={styles.switchLink} type="button" onClick={onSwitchToLogin}>
                Đăng nhập ngay
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
