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
        
        // ИСПРАВЛЕННЫЙ КОНФИГ - используем правильные константы
        VKIDSDK.Config.init({
          app: 54348608, // твой app_id
          // app: 54350017, // твой app_id
          redirectUrl: 'https://profdailog.com/auth/vk/callback',
          // redirectUrl: 'https://334e6011ee732584872ff7d0ba1a0b3b.serveo.net/auth/vk/callback/auth/vk/callback', // или тот порт, где фронтенд
          // Убрал responseMode и source - они устарели в новой версии
          scope: 'email',
        });

        console.log('✅ VK ID инициализирован');

        // Создаем экземпляр OneTap
        const oneTap = new VKIDSDK.OneTap();
        
        // Рендерим кнопку
        if (containerRef.current) {
          console.log('🔄 Рендерим кнопку...');
          
          oneTap
            .render({
              container: containerRef.current,
              fastAuthEnabled: false,
              showAlternativeLogin: true,
              style: {
                width: 300,
                height: 50
              }
            })
            .on(VKIDSDK.WidgetEvents.ERROR, (error) => {
              console.error('❌ Ошибка виджета:', error);
              setStatus('error');
            })
            .on('one_tap_auth_success', async (payload) => { // Изменил событие
              console.log('✅ Успешный логин:', payload);
              try {
                const response = await vkAuth(payload.code, payload.device_id);
                await login({
                  access_token: response.access_token,
                  refresh_token: response.refresh_token,
                  user: response.user
                });
                navigate('/dashboard');
              } catch (err) {
                console.error('VK Login error:', err);
              }
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

    // Очистка при размонтировании
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
      {/* Контейнер для кнопки VK */}
      <div 
        ref={containerRef} 
        style={{
          minHeight: '50px',
          border: status === 'error' ? '2px dashed red' : 'none'
        }}
      />
      
      {/* Отладочная информация */}
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Статус: {status === 'loading' && 'Загрузка...'}
        {status === 'loaded' && '✅ Кнопка загружена'}
        {status === 'error' && '❌ Ошибка загрузки'}
      </div>
    </div>
  );
};

export default VKAuthSDK;