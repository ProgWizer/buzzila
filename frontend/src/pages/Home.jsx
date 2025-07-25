import React from 'react';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6faff] dark:bg-gray-900 flex flex-col overflow-x-hidden">
      <style>{`
        .home-card, .home-title, .home-desc, .home-btn { font-size: 15px; }
        .home-btn { padding: 14px 0; min-width: 120px; min-height: 44px; }
        input, textarea { font-size: 15px !important; min-height: 44px; }
        @media (max-width: 640px) {
          .home-card { padding: 10px !important; min-height: 90px; }
          .home-icon { width: 28px !important; height: 28px !important; }
          .home-title { font-size: 15px !important; }
          .home-desc { font-size: 11px !important; }
          .home-btn { font-size: 12px !important; padding: 8px 0 !important; min-width: 90px !important; }
          .home-card, .home-title, .home-desc, .home-btn { font-size: 13.5px; }
          .home-btn { padding: 12px 0 !important; min-width: 90px !important; min-height: 40px !important; }
          input, textarea { font-size: 13.5px !important; min-height: 38px; }
        }
        @media (min-width: 641px) {
          .home-card { padding: 22px !important; min-height: 120px; }
          .home-icon { width: 40px !important; height: 40px !important; }
          .home-title { font-size: 22px !important; }
          .home-desc { font-size: 15px !important; }
          .home-btn { font-size: 16px !important; padding: 13px 0 !important; min-width: 120px !important; }
        }
        .home-card { border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow 0.2s, border 0.2s, background 0.2s; }
        .home-card:active { box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .home-btn { border-radius: 10px; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,0.07); transition: background 0.2s, color 0.2s; }
      `}</style>
      {/* Приветствие */}
      <div className="w-full bg-white dark:bg-gray-900 shadow-sm pb-2 sm:pb-5 pt-2 sm:pt-6 px-0.5 sm:px-1 md:px-0">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="mb-1 sm:mb-3">
            <img src="/assets/Buzzila.png" alt="Buzzila" className="w-10 sm:w-20 h-auto mb-1" />
          </div>
          <h1 className="home-title font-extrabold mb-0.5 sm:mb-2 text-gray-900 dark:text-white text-center break-words leading-tight">Привет, я Бузилла!</h1>
          <p className="home-desc text-gray-700 dark:text-gray-300 mb-2 sm:mb-4 text-center max-w-xl break-words">Я предназначен для тренировки сотрудников службы работы с клиентами и для улучшения коммуникаций с ними</p>
          <Link to="/scenarios" className="home-btn inline-block bg-blue-600 hover:bg-blue-800 text-white font-bold px-4 rounded-lg transition-colors shadow text-center">Перейти в тренажёр →</Link>
        </div>
      </div>
      {/* Возможности тренажёра */}
      <div className="w-full bg-[#eaf4ff] dark:bg-gray-800 py-2 sm:py-5 px-0.5 sm:px-1 md:px-0">
        <div className="max-w-4xl mx-auto">
          <h2 className="home-title font-bold text-center mb-2 sm:mb-5 text-gray-900 dark:text-white break-words leading-tight">Возможности тренажера</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="home-card bg-[#fff7ed] dark:bg-gray-900 flex flex-col items-center shadow transition-all cursor-pointer">
              <ChatBubbleLeftRightIcon className="home-icon text-blue-500 mb-1" />
              <div className="font-semibold text-[11px] sm:text-base text-gray-900 dark:text-white mb-0.5 text-center break-words">Практикуйте общение с виртуальными клиентами в реалистичных сценариях</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="home-card bg-[#f0f9ff] dark:bg-gray-900 flex flex-col items-center shadow transition-all cursor-pointer">
              <UserCircleIcon className="home-icon text-blue-500 mb-1" />
              <div className="font-semibold text-[11px] sm:text-base text-gray-900 dark:text-white mb-0.5 text-center break-words">Отслеживайте свой прогресс и получайте персонализированные рекомендации</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="home-card bg-[#f7f3ff] dark:bg-gray-900 flex flex-col items-center shadow transition-all cursor-pointer">
              <ChartBarIcon className="home-icon text-purple-500 mb-1" />
              <div className="font-semibold text-[11px] sm:text-base text-gray-900 dark:text-white mb-0.5 text-center break-words">Анализируйте свои результаты и улучшайте навыки общения</div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Как это работает? */}
      <div className="w-full bg-[#f6faff] dark:bg-gray-900 py-2 sm:py-5 px-0.5 sm:px-1 md:px-0">
        <div className="max-w-4xl mx-auto">
          <h2 className="home-title font-bold text-center mb-2 sm:mb-5 text-blue-900 dark:text-blue-200 break-words leading-tight">Как это работает?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
            {[1,2,3,4].map((num, idx) => (
              <motion.div key={num} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="flex flex-col items-center transition-all cursor-pointer">
                <div className="home-icon rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-xs sm:text-lg mb-0.5">{num}</div>
                <div className="text-center text-[10px] sm:text-sm text-gray-700 dark:text-gray-200 break-words">
                  {idx === 0 && 'Выберите интересующий вас сценарий общения'}
                  {idx === 1 && 'Начните диалог с виртуальным клиентом'}
                  {idx === 2 && 'Анализируйте результаты и рекомендации'}
                  {idx === 3 && 'Регулярно практикуйтесь для достижения лучших результатов'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      {/* Готовы начать? */}
      {!user && (
        <div className="w-full bg-blue-800 dark:bg-blue-900 py-2 sm:py-5 px-0.5 sm:px-1 md:px-0">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="home-title text-white mb-0.5 sm:mb-2 text-center break-words leading-tight">Готовы начать?</h2>
            <p className="home-desc text-white text-center mb-2 sm:mb-4 break-words">Присоединяйтесь к тысячам пользователей, которые уже улучшают свои навыки общения</p>
            <Link to="/register" className="home-btn inline-block bg-white hover:bg-blue-100 text-blue-700 font-bold px-4 rounded-lg transition-colors shadow text-center">Зарегистрироваться</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 