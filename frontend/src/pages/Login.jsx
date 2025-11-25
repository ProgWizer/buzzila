import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VKAuthSDK from '../components/VKAuthSDK';

const YANDEX_CLIENT_ID = 'b269904fa9be4b55a7a253a69266e393'; // Вставь сюда свой

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const result = await login({ email, password });
            if (result.success) {
                const from = location.state?.from?.pathname || '/profile';
                navigate(from, { replace: true });
            } else {
                setError(result.error || 'Произошла ошибка при входе');
            }
        } catch (err) {
            setError(err.message || 'Произошла ошибка при входе');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-[#DDF8FF] dark:bg-gray-900 transition-colors">
            <div className="w-full max-w-[1440px] flex items-center justify-center py-[22px] px-[8vw] bg-[#FFFAF3] dark:bg-gray-800 shadow-lg mt-8 rounded-2xl transition-colors">
                <div className="w-full max-w-[480px] flex flex-col items-center space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-[#0D47A1] dark:text-blue-200 leading-tight transition-colors" style={{fontFamily: 'Inter, sans-serif'}}>
                        Войдите, чтобы начать тренировку или перейти в профиль
                    </h2>

                    {error && (
                        <div className="rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-3 text-center transition-colors">
                            <span className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* VK Login Button */}
                    <div className="mt-4 w-full">
                        <VKAuthSDK />
                    </div>

                    {/* Yandex Login Button */}
                    <div className="mt-4 w-full">
                        <a
                            href={`https://oauth.yandex.com/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=https://profdailog.com/auth/yandex/callback`}
                            className="w-full inline-block py-3 rounded-xl bg-[#ffcc00] hover:bg-[#f2b500] text-black font-medium text-lg text-center transition"
                        >
                            Войти через Яндекс
                        </a>
                    </div>

                    {/* Email + Password */}
                    <form className="w-full space-y-4 mt-6" onSubmit={handleSubmit}>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                        />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] dark:bg-blue-800 dark:hover:bg-blue-900 transition text-white font-semibold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/30 dark:focus:ring-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Загрузка...' : 'Войти'}
                        </button>
                    </form>

                    <div className="text-center text-sm mt-4">
                        <Link to="/register" className="text-[#0D47A1] dark:text-blue-300 hover:underline font-medium transition-colors">
                            Нет аккаунта? Зарегистрироваться
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
