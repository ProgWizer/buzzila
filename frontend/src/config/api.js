// api.js
import axios from 'axios';
import { refreshToken } from '../api/auth';
import { API_CONFIG } from './constants';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Интерцептор запросов
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор ответов
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если получили 401 и это не запрос на обновление сессии
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                // Пытаемся обновить сессию
                await refreshToken();
                // Повторяем оригинальный запрос
                return api(originalRequest);
            } catch (refreshError) {
                // Если не удалось обновить сессию, перенаправляем на страницу входа
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
