import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types';
import api from '../api';
import { getStaffMember } from '../api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface TokenPayload {
  user_id: number;
  role: {admin: boolean, moderator: boolean, staff: boolean};
  office_id: number;
  exp: number; // Добавлено поле exp для проверки срока действия
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Следите за изменениями
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверка и обновление токена при запуске
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<TokenPayload>(token);
          // Проверка срока действия токена
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            const userData = await getStaffMember(decoded.user_id);
            setUser({
              user_id: decoded.user_id,
              role: decoded.role,
              office_id: decoded.office_id,
              email: userData.data.email,
              first_name: userData.data.first_name,
              last_name: userData.data.last_name,
              phone_number: userData.data.phone_number
            });
            setIsAuthenticated(true);
            // Устанавливаем токен в заголовки axios
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Ошибка при декодировании токена:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/staff/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      const decoded = jwtDecode<TokenPayload>(token);
      setUser({
        user_id: decoded.user_id,
        role: decoded.role,
        office_id: decoded.office_id,
      });
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error: any) {
      console.error("Ошибка в AuthProvider:", error);
      setIsAuthenticated(false);
      if (error.message == 'Неверный email или пароль.') {
        throw new Error('Неверный email или пароль');
      } else {
        throw new Error(error.response?.data?.data?.message || 'Ошибка при входе');
      }
    } 
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('officeId');
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};