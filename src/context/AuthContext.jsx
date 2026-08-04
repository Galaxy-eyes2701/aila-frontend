import { createContext, useState, useCallback } from 'react';
import api from '../utils/api';
import { normalizeRole } from '../utils/role';

const AuthContext = createContext();

function clearRefreshTokenCookie() {
  document.cookie = 'refreshToken=; Path=/; Max-Age=0; SameSite=Lax';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed) return null;
      return {
        ...parsed,
        role: normalizeRole(parsed.role),
      };
    } catch { return null; }
  });

  const login = useCallback((accessToken, userData) => {
    const normalizedUser = {
      ...userData,
      role: normalizeRole(userData?.role),
    };

    if (!accessToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      setUser(null);
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('role', normalizedUser.role ?? '');
    setUser(normalizedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Dù BE logout lỗi, vẫn clear local session để tránh giữ trạng thái đăng nhập sai.
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('adminLoggedIn');
    clearRefreshTokenCookie();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;