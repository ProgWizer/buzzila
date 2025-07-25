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
    Legend
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
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(null);
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementSort, setAchievementSort] = useState('name');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [timeStats, setTimeStats] = useState(null);
  const [timeHistory, setTimeHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

    const fetchProfileData = async () => {
    setRefreshing(true);
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Токен авторизации не найден. Пожалуйста, войдите.');
        }
        // Загрузка профиля пользователя
        const profileResponse = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
        setTimeHistory(profileData.timeHistory || []);
        // Загрузка достижений пользователя
        const achievementsResponse = await fetch('/api/achievements/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
      }
    };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Автоматическое обновление профиля при изменении достижений
  useEffect(() => {
    if (!loading && !refreshing) {
      fetchProfileData();
    }
    // eslint-disable-next-line
  }, [achievements.length]);

  useEffect(() => {
    const fetchProgress = async () => {
      setProgressLoading(true);
      setProgressError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/progress/', {
          headers: {
            'Authorization': `Bearer ${token}`,
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

  useEffect(() => {
    setActivityLoading(true);
    const token = localStorage.getItem('access_token');
    fetch('/api/activity/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setActivity(data);
        setActivityLoading(false);
      })
      .catch(() => setActivityLoading(false));
  }, []);


  const filteredAchievements = achievements
    .filter(a =>
      (a.name || '').toLowerCase().includes(achievementSearch.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(achievementSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (achievementSort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

  // Новый расчет баллов за достижения
  const totalAchievements = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.points || 0), 0);

  // --- График: динамика завершённых тренировок по дням (30 дней) ---
  const days = 7;
  const today = new Date();
  const dateLabels = Array.from({length: days}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d.toLocaleDateString();
  });
  const completedPerDay = dateLabels.map(date =>
    progress.filter(p =>
      p.status === 'completed' &&
      p.updated_at && new Date(p.updated_at).toLocaleDateString() === date
    ).length
  );
  // streak: максимальное и текущее количество дней подряд с тренировками
  let maxStreak = 0, currentStreak = 0, tempStreak = 0;
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
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 flex items-center justify-center transition-colors"><div className="text-gray-600 dark:text-gray-200 text-lg">Загрузка профиля...</div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 flex items-center justify-center transition-colors"><div className="text-red-600 dark:text-red-400 text-lg">Ошибка: {error}</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-0.5 sm:px-2 md:px-0 transition-colors overflow-x-hidden">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 sm:p-6 transition-colors">
        {/* Кнопка обновления профиля */}
        <div className="flex justify-end mb-1 sm:mb-4">
          <button
            onClick={fetchProfileData}
            disabled={refreshing}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded transition-colors disabled:opacity-60 text-xs sm:text-base min-w-[90px] sm:min-w-[120px]"
          >
            {refreshing ? 'Обновление...' : 'Обновить профиль'}
          </button>
        </div>
        {/* Верхний блок: аватар, имя, статус, баллы, роль */}
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 mb-4 sm:mb-8">
          <div className="flex-shrink-0 mb-2 md:mb-0">
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-blue-400 to-green-400 dark:from-blue-900 dark:to-green-800 flex items-center justify-center text-lg sm:text-2xl font-bold text-white shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="h-14 w-14 sm:h-20 sm:w-20 rounded-full object-cover" />
              ) : (
                user.name.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-lg sm:text-2xl font-extrabold mb-0.5 text-gray-900 dark:text-gray-100 transition-colors break-words leading-tight">{user.name}</h1>
            <p className="text-gray-500 dark:text-gray-300 mb-1 transition-colors text-xs sm:text-base break-words">{user.email}</p>
            <div className="flex flex-wrap gap-1 items-center justify-center md:justify-start text-xs sm:text-sm mt-1">
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-2 py-0.5 rounded-full transition-colors">{user.status}</span>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full transition-colors">Роль: {user.role ? user.role.toUpperCase() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Новый блок статистики */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow p-2 text-center transition-colors">
            <div className="text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2 text-blue-600 dark:text-blue-300">{progress && progress.length ? progress.length : 0}</div>
            <div className="text-gray-600 dark:text-gray-200 text-xs sm:text-lg font-medium">Тренировок</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow p-2 text-center transition-colors">
            <div className="text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2 text-green-600 dark:text-green-300">{totalAchievements}</div>
            <div className="text-gray-600 dark:text-gray-200 text-xs sm:text-lg font-medium">Достижений</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow p-2 text-center transition-colors">
            <div className="text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2 text-yellow-600 dark:text-yellow-300">{totalPoints}</div>
            <div className="text-gray-600 dark:text-gray-200 text-xs sm:text-lg font-medium">Баллы</div>
          </div>
        </div>

        {/* Достижения */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-4 text-gray-900 dark:text-gray-100 transition-colors">Достижения</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1 sm:mb-4">
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              className="border border-gray-300 dark:border-gray-600 rounded-[8px] px-2 py-1 focus:outline-none focus:border-[#0D47A1] w-full sm:w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 text-xs sm:text-base"
              value={achievementSearch}
              onChange={e => setAchievementSearch(e.target.value)}
            />
            <button
              className="border border-gray-300 dark:border-gray-600 rounded-[8px] px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-base min-w-[90px] sm:min-w-[120px]"
              disabled
            >
              Сортировать по названию
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-4 max-h-44 sm:max-h-60 overflow-y-auto pr-1 sm:pr-4">
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className={
                    `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'} ` +
                    'rounded-xl p-1.5 sm:p-4 text-center shadow-lg transition cursor-pointer flex flex-col items-center ' +
                    (ach.unlocked
                      ? 'bg-gradient-to-br from-[#232b3a] to-[#4ade80] border-2 border-green-400 hover:shadow-green-400/40'
                      : 'bg-[#232b3a]/80 border border-gray-600 hover:shadow-lg')
                  }
                  style={{ minHeight: 80 }}
                  onClick={() => setSelectedAchievement(ach)}
                >
                  {ach.unlocked && ach.icon_url ? (
                    <img src={ach.icon_url} alt="achievement icon" className="w-7 h-7 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-2 drop-shadow-lg" />
                  ) : (
                    <LockClosedIcon className="w-7 h-7 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-2 text-gray-400" />
                  )}
                  <div className={
                    'font-bold mb-0.5 ' + (ach.unlocked ? 'text-white' : 'text-gray-300')
                  }>{ach.name}</div>
                  {/* Баллы за достижение */}
                  {ach.unlocked ? (
                    <div className="text-xs font-semibold mb-0.5 text-yellow-200">
                      +{ach.points || 0} баллов
                    </div>
                  ) : (
                    <div className="text-xs font-semibold mb-0.5 text-yellow-400">
                      Можно получить: +{ach.points || 0} баллов
                    </div>
                  )}
                  {/* Требования */}
                    <div className={
                      'text-xs mb-0.5 ' + (ach.unlocked ? 'text-blue-100' : 'text-blue-300')
                    }>
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
                  <div className={
                    'text-xs sm:text-sm ' + (ach.unlocked ? 'text-green-100' : 'text-gray-400')
                  }>{ach.description}</div>
                  {ach.unlocked && ach.achieved_at && (
                    <div className="text-green-200 text-xs mt-0.5">
                      Получено: {new Date(ach.achieved_at).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 text-xs sm:text-base">
                Пока нет достижений.
              </div>
            )}
          </div>
        </div>

        {/* Модалка подробной информации о достижении */}
        {selectedAchievement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-[95vw] sm:max-w-sm dark:text-gray-100 text-xs sm:text-base max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-2 sm:mb-4">
                <h3 className="text-base sm:text-xl font-bold">{selectedAchievement.name}</h3>
                <button onClick={() => setSelectedAchievement(null)} className="text-gray-500 hover:text-gray-700 p-1 sm:p-2" aria-label="Закрыть модальное окно" tabIndex={0}>
                  <span className="text-xl sm:text-2xl">×</span>
                </button>
              </div>
              {selectedAchievement.icon_url && (
                <img src={selectedAchievement.icon_url} alt="icon" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4" />
              )}
              <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-yellow-500 dark:text-yellow-300">+{selectedAchievement.points || 0} баллов</div>
              {selectedAchievement.requirements && selectedAchievement.requirements.type && selectedAchievement.requirements.type !== 'none' && (
                <div className="text-xs sm:text-sm mb-1 sm:mb-2 text-blue-700 dark:text-blue-200">
                  Требование: {selectedAchievement.requirements.value}
                </div>
              )}
              <div className="mb-1 sm:mb-2 text-gray-700 text-xs sm:text-base">{selectedAchievement.description}</div>
              {selectedAchievement.unlocked && selectedAchievement.achieved_at && (
                <div className="text-gray-400 text-xs mb-1 sm:mb-2">
                  Получено: {new Date(selectedAchievement.achieved_at).toLocaleDateString()}
                </div>
              )}
              <div className="flex justify-end mt-2">
                <button onClick={() => setSelectedAchievement(null)} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 w-full sm:w-auto rounded transition-colors">Закрыть</button>
              </div>
            </div>
          </div>
        )}

        {/* График прогресса */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 md:p-6 text-center mb-4 sm:mb-8 transition-colors overflow-x-auto">
          <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-gray-700 dark:text-gray-100">Динамика тренировок (30 дней)</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 sm:mb-4 gap-1">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Текущий стрик: <span className="font-bold text-blue-700 dark:text-blue-400">{currentStreak}</span> дней</span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Максимальный стрик: <span className="font-bold text-green-700 dark:text-green-400">{maxStreak}</span> дней</span>
          </div>
          <div className="h-40 sm:h-64 min-w-[320px]">
            {progressLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">Загрузка...</div>
            ) : progressError ? (
              <div className="text-red-500">{progressError}</div>
            ) : (
              <Line
                data={{
                  labels: dateLabels,
                  datasets: [
                    {
                      label: 'Завершённые тренировки',
                      data: completedPerDay,
                      borderColor: 'rgb(37,99,235)',
                      backgroundColor: 'rgba(37,99,235,0.2)',
                      tension: 0.3,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: 'rgb(37,99,235)',
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { title: { display: true, text: 'Дата' } },
                    y: { title: { display: true, text: 'Тренировок' }, beginAtZero: true, stepSize: 1 },
                  },
                }}
              />
            )}
          </div>
        </div>


        {/* История активности */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 md:p-6 text-center text-gray-700 dark:text-gray-100 text-xs sm:text-lg transition-colors">
          <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">История активности</h2>
          {activityLoading ? (
            <div className="text-gray-400">Загрузка...</div>
          ) : activity.length > 0 ? (
            <ul className="space-y-1 sm:space-y-2 text-left max-h-32 sm:max-h-48 overflow-y-auto pr-1">
              {activity.map((item, idx) => (
                <li key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-1 sm:pb-2">
                  <span className="font-semibold">{item.date}:</span> {item.action}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">Нет активности</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 