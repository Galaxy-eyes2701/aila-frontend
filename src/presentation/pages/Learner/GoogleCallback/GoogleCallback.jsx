import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@state/hooks/useAuth';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Đọc fragment/query từ URL: #accessToken=... HOẶC #error=ACCOUNT_BANNED&errorMessage=...
    const hash = window.location.hash.substring(1); // bỏ dấu #
    const params = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const accessToken  = params.get('accessToken') || searchParams.get('accessToken');
    const error        = params.get('error') || searchParams.get('error');
    const errorMessage = params.get('errorMessage') || searchParams.get('errorMessage');

    if (error || errorMessage) {
      window.history.replaceState(null, '', '/');
      navigate('/', { replace: true, state: { authError: errorMessage || 'Tài khoản của bạn đã bị khóa.' } });
      return;
    }

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