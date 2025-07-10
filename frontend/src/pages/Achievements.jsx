import React, { useEffect, useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/achievements/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Ошибка при загрузке достижений');
        }
        const data = await response.json();
        setAchievements(data);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить достижения');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 mt-8">Загрузка достижений...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-2 md:px-0 transition-colors">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-10 text-center text-gray-800 dark:text-gray-100 transition-colors">Достижения</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`relative rounded-2xl shadow-xl p-8 flex flex-col items-center border-2 transition-all duration-300 transition-colors
                ${ach.unlocked ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}
              `}
            >
              <div className="mb-4">
                {ach.unlocked && ach.icon_url ? (
                  <img src={ach.icon_url} alt="achievement" className="w-16 h-16" />
                ) : (
                  <LockClosedIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <h2 className={`text-xl font-bold mb-2 text-center transition-colors ${ach.unlocked ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-200'}`}>{ach.name}</h2>
              {/* Баллы за достижение */}
              {ach.unlocked ? (
                <div className="text-xs font-semibold mb-1 text-yellow-600 dark:text-yellow-200">
                  +{ach.points || 0} баллов
                </div>
              ) : (
                <div className="text-xs font-semibold mb-1 text-gray-400 dark:text-gray-500">
                  Можно получить: +{ach.points || 0} баллов
                </div>
              )}
              {/* Требования */}
              <div className={`text-xs mb-1 ${ach.unlocked ? 'text-blue-700 dark:text-blue-200' : 'text-blue-500 dark:text-blue-300'}`}>
                {
                  !ach.requirements || !ach.requirements.type || ach.requirements.type === 'none'
                    ? 'Требование: нет'
                    : ach.requirements.type === 'total_dialogs'
                      ? `Требование: завершить ${ach.requirements.value} диалогов`
                      : ach.requirements.type === 'time'
                        ? `Требование: потратить ${ach.requirements.value} секунд`
                        : `Требование: ${ach.requirements.value}`
                }
              </div>
              <p className="text-gray-500 dark:text-gray-300 text-center mb-4 transition-colors">{ach.description}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 transition-colors">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${ach.unlocked ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-blue-400 dark:bg-blue-600'}`}
                  style={{ width: `${ach.progress || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-xs text-gray-400 dark:text-gray-300 transition-colors">
                <span>{ach.progress || 0}%</span>
                {ach.achieved_at && ach.unlocked && (
                  <span>Получено: {new Date(ach.achieved_at).toLocaleDateString()}</span>
                )}
              </div>
              {ach.unlocked && (
                <span className="absolute top-4 right-4 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-1 rounded-full text-xs font-semibold shadow transition-colors">Получено</span>
              )}
              {!ach.unlocked && (
                <span className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold shadow transition-colors">Не получено</span>
              )}
            </div>
          ))}
        </div>
        {achievements.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-300 mt-8 transition-colors">
            У вас пока нет достижений. Продолжайте тренироваться!
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements; 