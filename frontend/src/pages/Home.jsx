import React from 'react';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6faff] dark:bg-gray-900 flex flex-col">
      {/* Приветствие */}
      <div className="w-full bg-white dark:bg-gray-900 shadow-sm pb-8 pt-10 px-2 md:px-0">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="mb-4">
            {/* Картинка Buzzila (теперь просто маскот, без круглой рамки и фона) */}
            <img src="/assets/Buzzila.png" alt="Buzzila" className="w-32 h-auto mb-2" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-gray-900 dark:text-white text-center">Привет, я Бузилла!</h1>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 text-center max-w-xl">Я предназначен для тренировки сотрудников службы работы с клиентами и для улучшения коммуникаций с ними</p>
          <Link to="/scenarios" className="inline-block bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow">Перейти в тренажёр →</Link>
        </div>
      </div>

      {/* Возможности тренажёра */}
      <div className="w-full bg-[#eaf4ff] dark:bg-gray-800 py-10 px-2 md:px-0">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Возможности тренажера</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#fff7ed] dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center shadow">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-500 mb-3" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1 text-center">Практикуйте общение с виртуальными клиентами в реалистичных сценариях</div>
            </div>
            <div className="bg-[#f0f9ff] dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center shadow">
              <UserCircleIcon className="w-10 h-10 text-blue-500 mb-3" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1 text-center">Отслеживайте свой прогресс и получайте персонализированные рекомендации</div>
            </div>
            <div className="bg-[#f7f3ff] dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center shadow">
              <ChartBarIcon className="w-10 h-10 text-purple-500 mb-3" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1 text-center">Анализируйте свои результаты и улучшайте навыки общения</div>
            </div>
          </div>
        </div>
      </div>

      {/* Как это работает? */}
      <div className="w-full bg-[#f6faff] dark:bg-gray-900 py-10 px-2 md:px-0">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-blue-900 dark:text-blue-200">Как это работает?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-lg mb-2">1</div>
              <div className="text-center text-gray-700 dark:text-gray-200 text-sm">Выберите интересующий вас сценарий общения</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-lg mb-2">2</div>
              <div className="text-center text-gray-700 dark:text-gray-200 text-sm">Начните диалог с виртуальным клиентом</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-lg mb-2">3</div>
              <div className="text-center text-gray-700 dark:text-gray-200 text-sm">Анализируйте результаты и рекомендации</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-lg mb-2">4</div>
              <div className="text-center text-gray-700 dark:text-gray-200 text-sm">Регулярно практикуйтесь для достижения лучших результатов</div>
            </div>
          </div>
        </div>
      </div>

      {/* Готовы начать? */}
      {!user && (
        <div className="w-full bg-blue-800 dark:bg-blue-900 py-10 px-2 md:px-0">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">Готовы начать?</h2>
            <p className="text-white text-center mb-6">Присоединяйтесь к тысячам пользователей, которые уже улучшают свои навыки общения</p>
            <Link to="/register" className="inline-block bg-white hover:bg-blue-100 text-blue-700 font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow">Зарегистрироваться</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 