import React, { useEffect, useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-2 sm:py-6 px-0.5 sm:px-1 md:px-0 transition-colors overflow-x-hidden">
      <style>{`
        .ach-card { font-size: 15px; }
        .ach-title, .ach-desc, .ach-badge { font-size: 15px; }
        .ach-bar { height: 13px; }
        .ach-badge { padding: 4px 14px; }
        input, textarea { font-size: 15px !important; min-height: 44px; }
        @media (max-width: 640px) {
          .ach-card { font-size: 13.5px; }
          .ach-title, .ach-desc, .ach-badge { font-size: 13.5px; }
          .ach-bar { height: 9px; }
          .ach-badge { padding: 3px 8px; }
          input, textarea { font-size: 13.5px !important; min-height: 38px; }
        }
        .ach-card { border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow 0.2s, border 0.2s, background 0.2s; }
        .ach-card:active { box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .ach-bar { border-radius: 8px; transition: width 0.4s; }
        .ach-badge { border-radius: 999px; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
      `}</style>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-base sm:text-2xl font-extrabold mb-2 sm:mb-6 text-center text-gray-800 dark:text-gray-100 transition-colors break-words leading-tight">Достижения</h1>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-3">
          {achievements.map((ach) => (
            <motion.div
              key={ach.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`ach-card relative flex flex-col items-center border transition-all duration-200 cursor-pointer
                ${ach.unlocked ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}
              `}
            >
              <div className="mb-1 flex items-center justify-center">
                {ach.unlocked && ach.icon_url ? (
                  <img src={ach.icon_url} alt="achievement" className="ach-icon" />
                ) : (
                  <LockClosedIcon className="ach-icon text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <h2 className={`ach-title font-bold mb-0.5 text-center transition-colors break-words leading-tight ${ach.unlocked ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-200'}`}>{ach.name}</h2>
              {ach.unlocked ? (
                <div className="text-[11px] font-semibold mb-0.5 text-yellow-600 dark:text-yellow-200">
                  +{ach.points || 0} баллов
                </div>
              ) : (
                <div className="text-[11px] font-semibold mb-0.5 text-gray-400 dark:text-gray-500">
                  Можно получить: +{ach.points || 0} баллов
                </div>
              )}
              <div className={`text-[11px] mb-0.5 ${ach.unlocked ? 'text-blue-700 dark:text-blue-200' : 'text-blue-500 dark:text-blue-300'}`}
                style={{minHeight: 16}}>
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
              <p className="ach-desc text-gray-500 dark:text-gray-300 text-center mb-1 transition-colors break-words">{ach.description}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 ach-bar mb-0.5 transition-colors">
                <div
                  className={`ach-bar transition-all duration-300 ${ach.unlocked ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-blue-400 dark:bg-blue-600'}`}
                  style={{ width: `${ach.progress || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-[10px] text-gray-400 dark:text-gray-300 transition-colors">
                <span>{ach.progress || 0}%</span>
                {ach.achieved_at && ach.unlocked && (
                  <span>{new Date(ach.achieved_at).toLocaleDateString()}</span>
                )}
              </div>
              {ach.unlocked && (
                <span className="ach-badge absolute top-1 right-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200">Получено</span>
              )}
              {!ach.unlocked && (
                <span className="ach-badge absolute top-1 right-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300">Не получено</span>
              )}
            </motion.div>
          ))}
        </div>
        {achievements.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-300 mt-8 transition-colors text-xs sm:text-base">
            У вас пока нет достижений. Продолжайте тренироваться!
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements; 