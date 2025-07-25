import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-lg transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16 items-center">
                    {/* Левый блок - логотип */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <img
                                className="h-12 w-12 object-contain"
                                src="/assets/Buzzila.png"
                                alt="Буззила"
                            />
                        </Link>
                    </div>

                    {/* Бургер-меню для мобильных */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-label="Открыть меню"
                        >
                            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Обычное меню (desktop) */}
                    <div className="hidden md:flex items-center">
                        {user ? (
                            <>
                                <Link
                                    to="/achievements"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/achievements') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Достижения
                                </Link>
                                <Link
                                    to="/scenarios"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/scenarios') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Сценарии
                                </Link>
                                {user && (user.role === 'admin' || user.role === 'manager') && (
                                    <>
                                        {user.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                Админ-панель
                                            </Link>
                                        )}
                                        <Link
                                            to="/manager"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/manager') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            Модераторская
                                        </Link>
                                    </>
                                )}
                                <div className="ml-4 relative flex items-center">
                                    <Link
                                        to="/profile"
                                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <svg
                                                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {user.username}
                                        </span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-4 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Выйти
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                    <svg
                                        className="h-5 w-5 text-gray-500 dark:text-gray-300"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">Войти</span>
                            </Link>
                        )}
                    </div>
                </div>
                {/* Мобильное меню (dropdown) */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg py-2 px-4 z-50 absolute left-0 right-0 mx-2">
                        {user ? (
                            <>
                                <Link
                                    to="/achievements"
                                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors mb-1 ${location.pathname.startsWith('/achievements') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Достижения
                                </Link>
                                <Link
                                    to="/scenarios"
                                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors mb-1 ${location.pathname.startsWith('/scenarios') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Сценарии
                                </Link>
                                {(user.role === 'admin' || user.role === 'manager') && (
                                    <>
                                        {user.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors mb-1 ${location.pathname.startsWith('/admin') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Админ-панель
                                            </Link>
                                        )}
                                        <Link
                                            to="/manager"
                                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors mb-1 ${location.pathname.startsWith('/manager') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Модераторская
                                        </Link>
                                    </>
                                )}
                                <Link
                                    to="/profile"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white mb-1"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Профиль: {user.username}
                                </Link>
                                <button
                                    onClick={async () => { await handleLogout(); setMobileMenuOpen(false); }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900 mb-1"
                                >
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Войти
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar; 