import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const YandexCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (!code) {
      console.error('Код Яндекс не получен');
      return;
    }

    const verifyYandex = async () => {
      try {
        const response = await axios.post('/api/auth/yandex/verify', { code });
        await login({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          user: response.data.user
        });
        navigate('/profile');
      } catch (err) {
        console.error('Ошибка при верификации Яндекс:', err);
      }
    };

    verifyYandex();
  }, [location, login, navigate]);

  return <div>Загрузка…</div>;
};

export default YandexCallback;
