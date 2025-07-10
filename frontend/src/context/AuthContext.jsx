import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. При старте подтягиваем user из localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('userData');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check auth if we have a stored token
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        // Если нет access token, то и проверять нечего
        localStorage.removeItem('userData');
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        // Сохраняем user в localStorage
        localStorage.setItem('userData', JSON.stringify(userData.user));
      } else {
        // Если auth check fails, clear tokens and user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userData');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userData');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Store tokens and user on successful login
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка при входе' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Ошибка при входе в систему' };
    }
  };

  const logout = async () => {
    try {
      // Отправляем запрос на logout к бэкенду (если есть)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
      // Продолжаем очищать локальное состояние даже при ошибке запроса
    } finally {
      // Clear tokens and user state on logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userData');
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка регистрации' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Ошибка регистрации' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    checkAuth
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 