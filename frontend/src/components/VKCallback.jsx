import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vkAuth } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const VKCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const device_id = params.get('device_id');

    if (code && device_id) {
      vkAuth(code, device_id)
        .then(response => {
          login({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            user: response.user
          });
          navigate('/profile');
        })
        .catch(err => console.error('VK callback error:', err));
    }
  }, [login, navigate]);

  return <div>Авторизация через VK...</div>;
};

export default VKCallback;
