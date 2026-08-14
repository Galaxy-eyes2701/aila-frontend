import { useState } from 'react';
import api from '@services/api';
import useAuth from '@state/hooks/useAuth';
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

  const handleGoogle = async () => {
    try {
      const returnUrl = window.location.origin;
      const res = await api.get(`/auth/google/url?returnUrl=${encodeURIComponent(returnUrl)}`);
      if (res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      }
    } catch {
      setError('Không thể kết nối Google. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.overlay}>
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
              <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.6h146.9c-6.3 33.9-25.1 62.7-53.7 81.8v68h86.7c50.8-46.8 80.6-115.7 80.6-195z"/>
                <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24.1 178.2-65.6l-86.7-68c-24.1 16.2-55 25.7-91.5 25.7-70.4 0-130-47.5-151.3-111.2H33.9v69.9C78.2 488.4 169.1 544.3 272 544.3z"/>
                <path fill="#FBBC05" d="M120.7 323.2c-11.2-33.5-11.2-69.4 0-102.9V150.5H33.9c-37.7 73.9-37.7 161.4 0 235.3l86.8-62.6z"/>
                <path fill="#EA4335" d="M272 107.7c39.6 0 75.2 13.6 103.3 40.2l77.4-77.4C406.7 25 347.7 0 272 0 169.1 0 78.2 55.9 33.9 150.5l86.8 69.8C142 155.2 201.6 107.7 272 107.7z"/>
              </svg>
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
