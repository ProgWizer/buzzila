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
      console.log('🔄 Загружаем VK ID SDK...');
      
      if (window.VKIDSDK) {
        console.log('✅ VK ID SDK уже загружен');
        initVKID();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@2.0.0/dist-sdk/umd/index.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ VK ID SDK успешно загружен');
        initVKID();
      };
      
      script.onerror = () => {
        console.error('❌ Ошибка загрузки VK ID SDK');
        setStatus('error');
      };
      
      document.body.appendChild(script);
    };

    const initVKID = () => {
      try {
        console.log('🔄 Инициализируем VK ID...');
        if (!window.VKIDSDK) {
          console.error('❌ VKIDSDK не найден в window');
          setStatus('error');
          return;
        }

        const { VKIDSDK } = window;
        
        VKIDSDK.Config.init({
          app: 54348608,
          redirectUrl: 'https://profdailog.com/auth/vk/callback',
          scope: 'email',
        });

        console.log('✅ VK ID инициализирован');

        const oneTap = new VKIDSDK.OneTap();

        if (containerRef.current) {
          console.log('🔄 Рендерим кнопку...');
          
          oneTap
            .render({
              container: containerRef.current,
              fastAuthEnabled: false,
              showAlternativeLogin: true,
              style: { width: 300, height: 50 }
            })
            .on(VKIDSDK.WidgetEvents.SUCCESS, async (payload) => {
              console.log('✅ OneTap success:', payload);
              try {
                const response = await vkAuth(payload.code, payload.device_id);
                await login({
                  access_token: response.access_token,
                  refresh_token: response.refresh_token,
                  user: response.user
                });
                // Перенаправление на /profile
                navigate('/profile');
              } catch (err) {
                console.error('VK login error:', err);
                setStatus('error');
              }
            })
            .on(VKIDSDK.WidgetEvents.ERROR, (error) => {
              console.error('❌ OneTap error:', error);
              setStatus('error');
            });

          setStatus('loaded');
          console.log('✅ Кнопка отрендерена');
        } else {
          console.error('❌ containerRef.current не найден');
          setStatus('error');
        }

      } catch (error) {
        console.error('❌ Ошибка инициализации VK ID:', error);
        setStatus('error');
      }
    };

    loadVKID();

    return () => {
      if (window.VKIDSDK && window.VKIDSDK.OneTap) {
        try {
          const oneTap = new window.VKIDSDK.OneTap();
          oneTap.destroy();
        } catch (e) {
          console.log('Очистка OneTap:', e);
        }
      }
    };
  }, [login, navigate]);

  return (
    <div>
      <div 
        ref={containerRef} 
        style={{ minHeight: '50px', border: status === 'error' ? '2px dashed red' : 'none' }}
      />
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Статус: {status === 'loading' && 'Загрузка...'}
        {status === 'loaded' && '✅ Кнопка загружена'}
        {status === 'error' && '❌ Ошибка загрузки'}
      </div>
    </div>
  );
};

export default VKAuthSDK;
