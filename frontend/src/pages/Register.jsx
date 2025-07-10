import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Расширенная валидация
        if (!username || !email || !password || !confirmPassword) {
            setError('Все поля обязательны для заполнения');
            return;
        }

        if (username.length < 3) {
            setError('Имя пользователя должно содержать минимум 3 символа');
            return;
        }

        if (!validateEmail(email)) {
            setError('Пожалуйста, введите корректный email адрес');
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);

        try {
            console.log('Attempting registration with:', { username, email });
            await register(username, email, password);
            navigate('/login', {
                state: { message: 'Регистрация успешна! Теперь вы можете войти.' }
            });
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Произошла ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-[#DDF8FF] dark:bg-gray-900 transition-colors">
            <div className="w-full max-w-[1440px] flex items-center justify-center py-[22px] px-[8vw] bg-[#FFFAF3] dark:bg-gray-800 shadow-lg mt-8 rounded-2xl transition-colors">
                <div className="w-full max-w-[480px] flex flex-col items-center space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-[#0D47A1] dark:text-blue-200 leading-tight transition-colors" style={{fontFamily: 'Inter, sans-serif'}}>
                        Зарегистрируйтесь, чтобы начать тренировку. Это займёт всего пару минут
                    </h2>
                    <form className="w-full space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-3 text-center transition-colors">
                                <span className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                                placeholder="Имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{fontFamily: 'Inter, sans-serif'}}
                            />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{fontFamily: 'Inter, sans-serif'}}
                            />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{fontFamily: 'Inter, sans-serif'}}
                            />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#0D47A1] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0D47A1]/20 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm transition bg-white dark:bg-gray-900"
                                placeholder="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{fontFamily: 'Inter, sans-serif'}}
                            />
                        </div>

                        {/* Заглушки для соц. входа (если нужны и на регистрации) */}
                        <div className="flex flex-row gap-4 mb-2 w-full justify-center">
                          <div className="flex-1 min-w-[120px] max-w-[180px] bg-gray-100 dark:bg-gray-700 rounded-lg py-2 px-4 text-center text-gray-500 dark:text-gray-300 font-medium cursor-not-allowed select-none border border-gray-200 dark:border-gray-600 transition-colors">Google</div>
                          <div className="flex-1 min-w-[120px] max-w-[180px] bg-gray-100 dark:bg-gray-700 rounded-lg py-2 px-4 text-center text-gray-500 dark:text-gray-300 font-medium cursor-not-allowed select-none border border-gray-200 dark:border-gray-600 transition-colors">YandexID</div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] dark:bg-blue-800 dark:hover:bg-blue-900 transition text-white font-semibold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/30 dark:focus:ring-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ minHeight: 56, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20 }}
                        >
                            {loading ? (
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </button>

                        <div className="text-center text-sm mt-4">
                            <Link to="/login" className="text-[#0D47A1] dark:text-blue-300 hover:underline font-medium transition-colors">
                                Уже есть аккаунт? Войти
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register; 