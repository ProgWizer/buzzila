import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const YandexCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) return;

    const verifyYandex = async () => {
      try {
        const res = await fetch('/auth/yandex/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        if (!res.ok) throw new Error('Ошибка авторизации Яндекс');
        const data = await res.json();

        await login({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user
        });

        navigate('/profile'); // редирект после успешного входа
      } catch (err) {
        console.error('Yandex login error:', err);
      }
    };

    verifyYandex();
  }, [login, navigate]);

  return <div>Авторизация через Яндекс...</div>;
};

export default YandexCallback;
