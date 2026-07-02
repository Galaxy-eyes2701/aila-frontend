import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Đọc fragment từ URL: #accessToken=...&refreshToken=...
    const hash = window.location.hash.substring(1); // bỏ dấu #
    const params = new URLSearchParams(hash);

    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken) {
      // Không có token → về home
      navigate('/', { replace: true });
      return;
    }

    try {
      // Decode JWT để lấy thông tin user
      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      const userData = {
        userId:   payload.nameid  || payload.sub,
        fullName: payload.unique_name || payload.name || '',
        email:    payload.email   || '',
        role:     payload.role    || 'Learner',
      };

      // Lưu vào AuthContext + localStorage
      login(accessToken, userData);

      // Xoá fragment khỏi URL cho sạch
      window.history.replaceState(null, '', '/');

      // Redirect về home
      navigate('/', { replace: true });
    } catch {
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, color: 'var(--text-muted)'
    }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: 32 }} />
      <p>Đang xử lý đăng nhập Google...</p>
    </div>
  );
}