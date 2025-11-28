// src/pages/AuthSuccess.js

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Используйте ваш AuthContext

const AuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth, setTokensManually } = useAuth(); // Предположим, что у вас есть setTokensManually или checkAuth

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
            // 1. Сохранение токенов в LocalStorage (если не используете только HTTP-Only Cookies)
            // Если вы используете HTTP-Only Cookies, то Flask уже установил их,
            // и достаточно вызвать checkAuth для обновления состояния.

            // Если JWT-токены не в HTTP-Only Cookies, раскомментируйте это:
            // localStorage.setItem('access_token', accessToken);
            // localStorage.setItem('refresh_token', refreshToken);

            // 2. Обновление состояния пользователя и перенаправление
            checkAuth().then(() => {
                // Удаляем токены из URL и перенаправляем на профиль
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