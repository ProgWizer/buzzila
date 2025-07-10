import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-lg transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
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

                    {/* Правый блок - навигация */}
                    <div className="flex items-center">
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
                                {user.role === 'admin' && (
                                    <>
                                        <Link
                                            to="/admin"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            Админ-панель
                                        </Link>
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
            </div>
        </nav>
    );
};

export default Navbar; 