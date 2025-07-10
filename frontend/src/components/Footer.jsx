import React from 'react';
import { Link } from 'react-router-dom';
// import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" style={{ background: '#263238', color: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* О проекте */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">О проекте</h3>
            <p>
              Платформа для изучения норм и правил безопасности в игровой форме
            </p>
          </div>

          {/* Навигация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary-300">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-primary-300">
                  Чат
                </Link>
              </li>
              <li>
                <Link to="/achievements" className="hover:text-primary-300">
                  Достижения
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Контакты</h3>
            <ul className="space-y-2">
              <li>
                Email: support@example.com
              </li>
              <li>
                Телефон: +7 (XXX) XXX-XX-XX
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть футера */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center">
            © {currentYear} Все права защищены
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 