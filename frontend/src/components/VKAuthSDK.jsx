import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vkAuth } from '../api/auth';

const VKAuthSDK = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const loadVKID = () => {
      if (window.VKIDSDK) return initVKID();

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@2.0.0/dist-sdk/umd/index.js';
      script.async = true;
      script.onload = initVKID;
      script.onerror = () => setStatus('error');
      document.body.appendChild(script);
    };

    const initVKID = () => {
      if (!window.VKIDSDK) return setStatus('error');

      const { VKIDSDK } = window;

      // Инициализация VK ID v2
      VKIDSDK.Config.init({
        app: 54348608, // твой VK App ID
        redirectUrl: 'https://profdailog.com/auth/vk/callback',
        scope: 'email',
      });

      const oneTap = new VKIDSDK.OneTap();

      if (!containerRef.current) return setStatus('error');

      oneTap
        .render({
          container: containerRef.current,
          fastAuthEnabled: false,
          showAlternativeLogin: true,
          style: { width: 300, height: 50 }
        })
        .on(VKIDSDK.WidgetEvents.SUCCESS, async (payload) => {
          try {
            // Отправка кода и device_id на бекенд
            const response = await vkAuth(payload.code, payload.device_id);
            await login({
              access_token: response.access_token,
              refresh_token: response.refresh_token,
              user: response.user
            });
            navigate('/profile');
          } catch (err) {
            console.error('VK OneTap error:', err);
            setStatus('error');
          }
        })
        .on(VKIDSDK.WidgetEvents.ERROR, (error) => {
          console.error('VK OneTap render error:', error);
          setStatus('error');
        });

      setStatus('loaded');
    };

    loadVKID();

    return () => {
      if (window.VKIDSDK && window.VKIDSDK.OneTap) {
        try {
          const oneTap = new window.VKIDSDK.OneTap();
          oneTap.destroy();
        } catch {}
      }
    };
  }, [login, navigate]);

  return (
    <div>
      <div ref={containerRef} style={{ minHeight: 50, border: status === 'error' ? '2px dashed red' : 'none' }} />
      <div style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
        Статус: {status === 'loading' && 'Загрузка...'}
        {status === 'loaded' && '✅ Кнопка загружена'}
        {status === 'error' && '❌ Ошибка'}
      </div>
    </div>
  );
};

export default VKAuthSDK;
