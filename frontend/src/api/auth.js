import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем интерцептор для логирования
api.interceptors.request.use(request => {
    return request;
});

api.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Ошибка при входе в систему');
    }
};

export const register = async (username, email, password) => {
    try {
        const response = await api.post('/auth/register', {
            name: username,
            email,
            password
        });
        return response.data;
    } catch (error) {
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Ошибка при регистрации');
    }
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        // console.error('Logout error:', error);
    }
};

export const checkAuth = async () => {
    try {
        const response = await api.get('/auth/check');
        return response.data;
    } catch (error) {
        return { success: false };
    }
};

export const refreshToken = async () => {
    try {
        const response = await api.post('/auth/refresh');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getProfile = async () => {
    try {
        const response = await api.get('/profile');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// VK ID Authentication
// export const vkAuth = async (code, deviceId) => {
//   try {
//     const response = await api.post('/auth/vk/verify', {
//       code,
//       device_id: deviceId
//     });
//     return response.data;
//   } catch (error) {
//     console.error('VK auth error:', error);
//     throw error.response?.data || error;
//   }
// };

export const vkAuth = async (code, device_id) => {
    const res = await fetch('/auth/vk/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, device_id })
    });
  
    if (!res.ok) throw new Error('VK auth failed');
    return res.json();
  };
export const yandexAuth = async (code) => {
    const res = await fetch('/auth/yandex/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

if (!res.ok) throw new Error('Yandex auth failed');
    return res.json();
};
