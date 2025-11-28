// src/pages/AuthSuccess.js

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const AuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useAuth(); 

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
            // 1. Сохранение токенов в LocalStorage (если Flask вернул их в URL)
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // 2. Обновление состояния пользователя и перенаправление
            checkAuth().then(() => {
                // Удаляем токены из URL (URL-очистка) и перенаправляем на профиль
                navigate('/profile', { replace: true });
            }).catch(() => {
                navigate('/login?error=auth_failed', { replace: true });
            });
        } else {
            navigate('/login?error=no_tokens', { replace: true });
        }
    }, [location, navigate, checkAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#DDF8FF]">
            <p className="text-xl text-[#0D47A1]">Авторизация VK успешна. Перенаправление...</p>
        </div>
    );
};

export default AuthSuccess;