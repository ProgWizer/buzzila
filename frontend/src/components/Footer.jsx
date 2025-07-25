import React from 'react';
import { Link } from 'react-router-dom';
// import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-[#263238] dark:bg-gray-900 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {/* О проекте */}
          <div className="space-y-2 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">О проекте</h3>
            <p className="text-xs sm:text-base text-gray-200 dark:text-gray-400">Платформа для изучения норм и правил безопасности в игровой форме</p>
          </div>

          {/* Навигация */}
          <div className="space-y-2 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Навигация</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-300 transition-colors duration-150 text-xs sm:text-base">Главная</Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-blue-300 transition-colors duration-150 text-xs sm:text-base">Чат</Link>
              </li>
              <li>
                <Link to="/achievements" className="hover:text-blue-300 transition-colors duration-150 text-xs sm:text-base">Достижения</Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div className="space-y-2 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Контакты</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-base">
              <li>Email: support@example.com</li>
              <li>Телефон: +7 (XXX) XXX-XX-XX</li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть футера */}
        <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-gray-700 dark:border-gray-800">
          <p className="text-center text-xs sm:text-base text-gray-300">© {currentYear} Все права защищены</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 