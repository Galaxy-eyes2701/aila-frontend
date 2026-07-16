import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ Email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', {
        username: form.username.trim(),
        password: form.password,
      });
      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('role', 'Admin');
        navigate('/admin/dashboard');
      } else {
        setError(res.data.errorMessage || 'Đăng nhập thất bại.');
      }
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authModalHeader}>
          <h2>Đăng nhập Admin</h2>
          <p>Nhập email và mật khẩu để truy cập khu vực quản trị.</p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className={styles.inputGroup}>
            <label>Email</label>
            <div className={styles.inputWrapper}>
              <i className="fas fa-user" />
              <input
                type="email"
                name="username"
                placeholder="Email"
                value={form.username}
                onChange={handleChange}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label>Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <i className="fas fa-lock" />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && <p className={styles.errorMsg}><i className="fas fa-exclamation-circle" /> {error}</p>}

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <><span className={styles.spinner} /> Đang xử lý...</> : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </main>
  );
}