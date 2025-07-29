import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    avatar: '',
    points: 0,
    status: '',
    role: '',
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState([]);
  const [dialogs, setDialogs] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(null);
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementSort, setAchievementSort] = useState('name');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [totalDialogs, setTotalDialogs] = useState(0);
  const [completedDialogs, setCompletedDialogs] = useState(0);
  const [timeStats, setTimeStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError(null);
    setActivityLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите.');
      }
      const profileResponse = await fetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!profileResponse.ok) {
        throw new Error('Не удалось загрузить данные профиля');
      }
      const profileData = await profileResponse.json();
      setUser(profileData.user);
      setTimeStats(profileData.timeStats || null);
      setTotalDialogs(profileData.statistics.totalDialogs || 0);
      setCompletedDialogs(profileData.statistics.completedDialogs || 0);
      setDailyActivity(profileData.dailyActivity || []);
      setDialogs(profileData.dialogs || []); // Добавляем dialogs
      const achievementsResponse = await fetch('/api/achievements/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!achievementsResponse.ok) {
        throw new Error('Не удалось загрузить достижения');
      }
      const achievementsData = await achievementsResponse.json();
      setAchievements(achievementsData);
    } catch (err) {
      setError(err.message || 'Произошла ошибка при загрузке данных.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    console.log('Fetched dailyActivity:', dailyActivity); // Отладка
  }, [achievements.length]);

  useEffect(() => {
    const fetchProgress = async () => {
      setProgressLoading(true);
      setProgressError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/progress/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Ошибка при загрузке прогресса');
        const data = await response.json();
        setProgress(data.progress || []);
      } catch (err) {
        setProgressError('Ошибка при загрузке прогресса');
      } finally {
        setProgressLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const filteredAchievements = achievements
    .filter((a) =>
      (a.name || '').toLowerCase().includes(achievementSearch.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(achievementSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (achievementSort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

  const totalAchievements = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  const days = 7;
  const today = new Date();
  const dateLabels = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const completedPerDay = dateLabels.map((date) => {
    const activityDate = date; // Уже в формате YYYY-MM-DD
    const activity = dailyActivity.find((item) => item.date === activityDate);
    return activity ? activity.completed_dialogs : 0;
  });
  let maxStreak = 0,
    currentStreak = 0,
    tempStreak = 0;
  for (let i = completedPerDay.length - 1; i >= 0; i--) {
    if (completedPerDay[i] > 0) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      if (i === completedPerDay.length - 1) currentStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 flex items-center justify-center transition-colors">
        <div className="text-gray-600 dark:text-gray-200 text-lg">Загрузка профиля...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 flex items-center justify-center transition-colors">
        <div className="text-red-600 dark:text-red-400 text-lg">Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-10 px-0.5 sm:px-2 md:px-0 transition-colors duration-300 overflow-x-hidden">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-end mb-4 sm:mb-6">
          <button
            onClick={() => {
              fetchProfileData();
            }}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70 text-sm sm:text-base min-w-[100px] sm:min-w-[140px] shadow-md hover:shadow-lg"
          >
            {refreshing ? 'Обновление...' : 'Обновить профиль'}
          </button>
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-6 sm:mb-10">
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-blue-400 to-green-500 dark:from-blue-700 dark:to-green-600 flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-xl ring-2 ring-blue-300 dark:ring-blue-800">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="h-16 w-16 sm:h-24 sm:w-24 rounded-full object-cover"
                />
              ) : (
                user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl sm:text-3xl font-extrabold mb-1 text-gray-900 dark:text-gray-100 transition-colors duration-200 break-words leading-tight">
              {user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-2 transition-colors text-sm sm:text-lg break-words">
              {user.email}
            </p>
            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start text-sm sm:text-base mt-2">
              <span className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full transition-colors duration-200 font-medium">
                {user.status}
              </span>
              <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full transition-colors duration-200 font-medium">
                Роль: {user.role ? user.role.toUpperCase() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-10">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-4 text-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
            <div className="text-xl sm:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">
              {completedDialogs}
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-base sm:text-xl font-medium">
              Тренировок
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-4 text-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
            <div className="text-xl sm:text-4xl font-bold mb-2 text-green-600 dark:text-green-400">
              {totalAchievements}
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-base sm:text-xl font-medium">
              Достижений
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-4 text-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
            <div className="text-xl sm:text-4xl font-bold mb-2 text-yellow-600 dark:text-yellow-400">
              {totalPoints}
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-base sm:text-xl font-medium">
              Баллы
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-10">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-6 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            Достижения
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 sm:mb-6">
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-72 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base transition-colors duration-200"
              value={achievementSearch}
              onChange={(e) => setAchievementSearch(e.target.value)}
            />
            <button
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base min-w-[100px] sm:min-w-[140px] shadow-sm hover:shadow-md"
              disabled
            >
              Сортировать по названию
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-h-48 sm:max-h-64 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar"
style={{
  '--scrollbar-thumb-light': '#d1d5db',
  '--scrollbar-track-light': '#f3f4f6',
  '--scrollbar-thumb-dark': '#4b5563',
  '--scrollbar-track-dark': '#1f2937',
  scrollbarWidth: 'thin',
  scrollbarColor: `var(--scrollbar-thumb-light) var(--scrollbar-track-light)`
}}>
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={
                    `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'} ` +
                    'rounded-xl p-2 sm:p-4 text-center shadow-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ' +
                    (ach.unlocked
                      ? 'bg-gradient-to-br from-[#1e293b] to-[#22c55e] border-2 border-green-500 dark:border-green-400 hover:shadow-green-500/30'
                      : 'bg-gray-800 border border-gray-700 hover:shadow-lg')
                  }
                  style={{ minHeight: 100 }}
                  onClick={() => setSelectedAchievement(ach)}
                >
                  {ach.unlocked && ach.icon_url ? (
                    <img
                      src={ach.icon_url}
                      alt="achievement icon"
                      className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 drop-shadow-md"
                    />
                  ) : (
                    <LockClosedIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-500 dark:text-gray-400" />
                  )}
                  <div className={'font-bold text-sm sm:text-base mb-1 ' + (ach.unlocked ? 'text-white' : 'text-gray-400')}>
                    {ach.name}
                  </div>
                  {ach.unlocked ? (
                    <div className="text-xs sm:text-sm font-semibold mb-1 text-yellow-300">
                      +{ach.points || 0} баллов
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm font-semibold mb-1 text-yellow-500">
                      Можно получить: +{ach.points || 0} баллов
                    </div>
                  )}
                  <div
                    className={
                      'text-xs sm:text-sm mb-1 ' + (ach.unlocked ? 'text-blue-200' : 'text-blue-400')
                    }
                  >
                    {!ach.requirements ||
                    !ach.requirements.type ||
                    ach.requirements.type === 'none'
                      ? 'Требование: нет'
                      : ach.requirements.type === 'total_dialogs'
                      ? `Требование: завершить ${ach.requirements.value} диалогов`
                      : ach.requirements.type === 'time'
                      ? `Требование: потратить ${ach.requirements.value} секунд`
                      : `Требование: ${ach.requirements.value}`}
                  </div>
                  <div
                    className={
                      'text-xs sm:text-sm ' + (ach.unlocked ? 'text-green-200' : 'text-gray-500')
                    }
                  >
                    {ach.description}
                  </div>
                  {ach.unlocked && ach.achieved_at && (
                    <div className="text-green-300 text-xs mt-1">
                      Получено: {new Date(ach.achieved_at).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-base sm:text-lg">
                Пока нет достижений.
              </div>
            )}
          </div>
        </div>

        {selectedAchievement && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md dark:text-gray-100 text-sm sm:text-base max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedAchievement.name}
                </h3>
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Закрыть модальное окно"
                  tabIndex={0}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              {selectedAchievement.icon_url && (
                <img
                  src={selectedAchievement.icon_url}
                  alt="icon"
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-lg"
                />
              )}
              <div className="text-sm sm:text-lg font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
                +{selectedAchievement.points || 0} баллов
              </div>
              {selectedAchievement.requirements &&
                selectedAchievement.requirements.type &&
                selectedAchievement.requirements.type !== 'none' && (
                  <div className="text-sm sm:text-lg mb-2 text-blue-700 dark:text-blue-300">
                    Требование: {selectedAchievement.requirements.value}
                  </div>
                )}
              <div className="mb-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                {selectedAchievement.description}
              </div>
              {selectedAchievement.unlocked && selectedAchievement.achieved_at && (
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  Получено: {new Date(selectedAchievement.achieved_at).toLocaleDateString()}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center mb-6 sm:mb-10 transition-colors duration-200 overflow-x-auto">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-6 text-gray-900 dark:text-gray-100">
            Динамика тренировок (7 дней)
          </h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 sm:mb-6 gap-2 text-sm sm:text-base">
            <span className="text-gray-600 dark:text-gray-300">
              Текущий стрик: <span className="font-bold text-blue-600 dark:text-blue-400">{currentStreak}</span> дней
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Максимальный стрик: <span className="font-bold text-green-600 dark:text-green-400">{maxStreak}</span> дней
            </span>
          </div>
          <div className="h-48 sm:h-64 min-w-[320px] bg-white dark:bg-gray-900 rounded-lg p-4 shadow-inner">
            {activityLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Загрузка...
              </div>
            ) : (
              <Line
                data={{
                  labels: dateLabels,
                  datasets: [
                    {
                      label: 'Завершённые тренировки',
                      data: completedPerDay,
                      borderColor: 'rgb(59,130,246)',
                      backgroundColor: 'rgba(59,130,246,0.3)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 5,
                      pointBackgroundColor: 'rgb(59,130,246)',
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#ffffff', titleColor: '#1f2937', bodyColor: '#1f2937', borderColor: '#e5e7eb', borderWidth: 1 },
                  },
                  scales: {
                    x: { title: { display: true, text: 'Дата', color: '#4b5563', font: { size: 14 } }, ticks: { color: '#6b7280' } },
                    y: { title: { display: true, text: 'Тренировок', color: '#4b5563', font: { size: 14 } }, beginAtZero: true, stepSize: 1, ticks: { color: '#6b7280' } },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center text-gray-700 dark:text-gray-100 text-sm sm:text-lg transition-colors duration-200">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-6 text-gray-900 dark:text-gray-100">
            История активности
          </h2>
          {activityLoading ? (
            <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
          ) : dialogs.length > 0 ? (
            <ul
              className="space-y-2 text-left max-h-40 sm:max-h-60 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar-activity"
style={{ 
  scrollbarWidth: 'thin', 
  scrollbarColor: `var(--scrollbar-thumb-light) var(--scrollbar-track-light)`,
  '--scrollbar-thumb-light': '#d1d5db',
  '--scrollbar-track-light': '#f3f4f6',
  '--scrollbar-thumb-dark': '#4b5563',
  '--scrollbar-track-dark': '#1f2937'
}}
            >
              {dialogs
                .filter((dialog) => dialog.status === 'completed')
                .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                .map((dialog, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="border-b border-gray-200 dark:border-gray-700 py-2 sm:py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(dialog.completed_at).toLocaleDateString() || 'Неизвестная дата'}:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-300">
                      Завершен диалог "{dialog.scenario_name || 'Неизвестный сценарий'}" (длительность: {dialog.duration ? `${dialog.duration} сек` : 'N/A'})
                    </span>
                  </motion.li>
                ))}
            </ul>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">Нет завершенных диалогов</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;