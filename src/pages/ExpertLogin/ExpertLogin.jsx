import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import styles from './ExpertLogin.module.css';

export default function ExpertLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/expert/login', {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

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
    }  catch (err) {
      console.log('Status:', err.response?.status);
      console.log('Data:', err.response?.data);
      console.log('Message:', err.message);
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
