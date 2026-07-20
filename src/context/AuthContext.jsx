import { createContext, useState, useCallback } from 'react';
import { normalizeRole } from '../utils/role';

const AuthContext = createContext();

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

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('adminLoggedIn');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;