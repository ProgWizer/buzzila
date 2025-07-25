import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Scenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSphere, setSelectedSphere] = useState(null);
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState();
  const [isTimed, setIsTimed] = useState(false);

  const navigate = useNavigate();

  // Derived states for unique spheres, situations, moods, and languages
  const uniqueSpheres = Array.from(new Set(scenarios.map(s => s.sphere)))
    .map(sphereName => ({ id: sphereName, name: sphereName }));

  const situationsBySphere = scenarios.reduce((acc, scenario) => {
    if (!acc[scenario.sphere]) {
      acc[scenario.sphere] = [];
    }
    if (!acc[scenario.sphere].some(s => s.name === scenario.situation)) {
      acc[scenario.sphere].push({ id: scenario.id, name: scenario.situation });
    }
    return acc;
  }, {});

  const uniqueMoods = Array.from(new Set(scenarios.map(s => s.mood)))
    .map(moodName => ({ value: moodName, label: moodName }));

  const uniqueLanguages = Array.from(new Set(scenarios.map(s => s.language)))
    .map(langName => ({ value: langName, label: langName }));

  // Fetch scenarios from backend
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Токен авторизации не найден.');
        }

        const response = await fetch('/api/scenarios', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось загрузить сценарии.');
        }

        const data = await response.json();
        setScenarios(data);
        setLoading(false);

        // Set initial selections if data is available
        if (data.length > 0) {
          const firstScenario = data[0];
          setSelectedSphere(firstScenario.sphere);
          setSelectedSituation(firstScenario.situation);
          setSelectedMood(firstScenario.mood);
          setSelectedLanguage(firstScenario.language);
        }

      } catch (err) {
        console.error('Ошибка при загрузке сценариев:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  const handleSphereSelect = (sphereName) => {
    setSelectedSphere(sphereName);
    // Find the first situation for the newly selected sphere
    const firstSituationInSphere = situationsBySphere[sphereName]?.[0];
    setSelectedSituation(firstSituationInSphere ? firstSituationInSphere.name : null);
  };

  const handleStartTraining = () => {
    const scenario = scenarios.find(
      s => s.sphere === selectedSphere && s.situation === selectedSituation
    );

    if (!scenario) {
      toast.error('Пожалуйста, выберите сферу и ситуацию.');
      return;
    }

    const trainingParams = {
      scenarioId: scenario.id,
      mood: selectedMood,
      language: selectedLanguage,
      isTimed: isTimed,
    };
    console.log('Начать тренировку с параметрами:', trainingParams);
    // alert('Тренировка начнется! (Логика запуска еще не реализована)');
    // TODO: Implement actual training start logic, e.g., navigate to chat page with params
    navigate('/chat', { state: { scenario, isTimed } });
  };

  const scrollContainer = (direction, id) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = 200; // Adjust as needed
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  const handleStartDialog = () => {
    const scenario = scenarios.find(
      s => s.sphere === selectedSphere && s.situation === selectedSituation
    );
    if (!scenario) {
      toast.error('Пожалуйста, выберите сферу и ситуацию.');
      return;
    }
    navigate('/chat', { state: { scenario, isTimed } });
  };
  if (loading) {
    return <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-12 flex items-center justify-center transition-colors"><div className="text-gray-600 dark:text-gray-200 text-lg">Загрузка сценариев...</div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-12 flex items-center justify-center transition-colors"><div className="text-red-600 dark:text-red-400 text-lg">Ошибка: {error}</div></div>;
  }
 
  // Добавляем CSS для скрытия скроллбара и теней
  const noScrollbarStyle = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scroll-shadow-left {
      box-shadow: inset 20px 0 20px -20px rgba(0,0,0,0.08);
      pointer-events: none;
      position: absolute;
      left: 0; top: 0; bottom: 0; width: 30px; z-index: 5;
    }
    .scroll-shadow-right {
      box-shadow: inset -20px 0 20px -20px rgba(0,0,0,0.08);
      pointer-events: none;
      position: absolute;
      right: 0; top: 0; bottom: 0; width: 30px; z-index: 5;
    }
  `;

  return (
    <>
      <style>{`
  .panel-table th, .panel-table td { padding: 13px 14px; font-size: 15px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
  .panel-table th { font-weight: 700; }
  .panel-table { border-radius: 12px; overflow: hidden; }
  .panel-btn { border-radius: 10px; font-weight: 700; font-size: 15px; padding: 14px 0; min-width: 120px; min-height: 44px; }
  .panel-pagination { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
  .panel-pagination button { padding: 10px 18px; border-radius: 8px; font-size: 15px; font-weight: 600; min-height: 40px; }
  input, textarea { font-size: 15px !important; min-height: 44px; }
  @media (max-width: 640px) {
    .panel-btn { font-size: 14px !important; padding: 12px 0 !important; min-width: 90px !important; min-height: 40px !important; }
    .panel-table th, .panel-table td { padding: 9px 7px; font-size: 13.5px; max-width: 90px; }
    .panel-pagination button { padding: 7px 12px; font-size: 13.5px; min-height: 36px; }
    input, textarea { font-size: 13.5px !important; min-height: 38px; }
  }
  .panel-table th, .panel-table td { color: #1a202c; }
  .dark .panel-table th, .dark .panel-table td { color: #f3f4f6; }
`}</style>
      <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-8 sm:py-12 flex flex-col items-center transition-colors">
        <h1 className="text-lg xs:text-2xl sm:text-4xl md:text-5xl lg:text-[48px] font-bold text-black dark:text-white mb-1 sm:mb-4 text-center font-['Inter'] transition-colors break-words leading-tight drop-shadow-lg">Сценарии тренировок</h1>
        <p className="text-xs sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-3 sm:mb-10 text-center break-words">Выберите параметры для вашей тренировки</p>

        {scenarios.length === 0 ? (
          <div className="w-full max-w-4xl px-4 text-center text-gray-500 dark:text-gray-300 text-lg sm:text-2xl transition-colors">
            Скоро здесь появятся новые сценарии!
          </div>
        ) : (
          <div className="w-full max-w-4xl px-0.5 sm:px-4">
            {/* Секция выбора сферы */}
            <div className="mb-4 sm:mb-12">
              <h2 className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1 sm:mb-3">Сфера</h2>
              <div className="relative flex items-center">
                <span className="scroll-shadow-left" />
                <button
                  onClick={() => scrollContainer('left', 'spheres-container')}
                  className="absolute left-0 z-10 p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  aria-label="Прокрутить влево"
                >
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-200" />
                </button>
                <div
                  id="spheres-container"
                  className="flex overflow-x-scroll no-scrollbar py-1.5 sm:py-2 space-x-1.5 sm:space-x-4 pr-6 sm:pr-10 pl-6 sm:pl-10 relative"
                >
                  {uniqueSpheres.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-300 text-base sm:text-lg transition-colors">Нет доступных сфер. Добавьте их в админ-панели.</p>
                  ) : (
                    uniqueSpheres.map(sphere => (
                      <motion.div
                        key={sphere.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-none px-2.5 py-2 sm:p-6 border-2 border-transparent rounded-2xl shadow-lg cursor-pointer transition-all duration-200 transition-colors text-center min-w-[90px] sm:min-w-[160px] ${
                          selectedSphere === sphere.name
                            ? 'bg-[#e0edff] dark:bg-blue-700 text-blue-900 dark:text-white border-blue-500'
                            : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSphereSelect(sphere.name)}
                      >
                        <p className="text-xs sm:text-lg font-medium text-blue-700 dark:text-blue-300 break-words">{sphere.name}</p>
                      </motion.div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => scrollContainer('right', 'spheres-container')}
                  className="absolute right-0 z-10 p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  aria-label="Прокрутить вправо"
                >
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-200" />
                </button>
                <span className="scroll-shadow-right" />
              </div>
            </div>

            {/* Секция выбора ситуации (появляется после выбора сферы) */}
            {selectedSphere && situationsBySphere[selectedSphere] && (
              <div className="mb-4 sm:mb-12">
                <h2 className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1 sm:mb-3">Ситуация</h2>
                <div className="relative flex items-center">
                  <span className="scroll-shadow-left" />
                  <button
                    onClick={() => scrollContainer('left', 'situations-container')}
                    className="absolute left-0 z-10 p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                    aria-label="Прокрутить влево"
                  >
                    <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-200" />
                  </button>
                  <div
                    id="situations-container"
                    className="flex overflow-x-scroll no-scrollbar py-1.5 sm:py-2 space-x-1.5 sm:space-x-4 pr-6 sm:pr-10 pl-6 sm:pl-10 relative"
                  >
                    {situationsBySphere[selectedSphere].length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-300 text-base sm:text-lg transition-colors">Нет доступных ситуаций для этой сферы.</p>
                    ) : (
                      situationsBySphere[selectedSphere].map(situation => (
                        <motion.div
                          key={situation.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          className={`flex-none px-2.5 py-2 sm:p-6 border-2 border-transparent rounded-2xl shadow-lg cursor-pointer transition-all duration-200 transition-colors text-center min-w-[90px] sm:min-w-[160px] ${
                            selectedSituation === situation.name
                              ? 'bg-[#e0edff] dark:bg-blue-700 text-blue-900 dark:text-white border-blue-500'
                              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => setSelectedSituation(situation.name)}
                        >
                          <p className="text-xs sm:text-lg font-medium text-blue-700 dark:text-blue-300 break-words">{situation.name}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => scrollContainer('right', 'situations-container')}
                    className="absolute right-0 z-10 p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                    aria-label="Прокрутить вправо"
                  >
                    <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-200" />
                  </button>
                  <span className="scroll-shadow-right" />
                </div>
              </div>
            )}

            {/* Секция выбора настроения */}
            <div className="mb-6 sm:mb-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <h2 className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-0.5 sm:mb-0 min-w-[90px] sm:min-w-[120px]">Настроение</h2>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="block w-full max-w-md p-2 sm:p-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100 text-xs sm:text-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm transition-colors"
              >
                {uniqueMoods.map(mood => (
                  <option key={mood.value} value={mood.value}>{mood.label}</option>
                ))}
              </select>
            </div>

            {/* Секция выбора языка */}
            <div className="mb-6 sm:mb-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <h2 className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-0.5 sm:mb-0 min-w-[90px] sm:min-w-[120px]">Язык</h2>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="block w-full max-w-md p-2 sm:p-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100 text-xs sm:text-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm transition-colors"
              >
                {uniqueLanguages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Секция выбора режима "на время" */}
            <div className="mb-8 sm:mb-12 flex items-center gap-3">
              <input
                type="checkbox"
                id="isTimed"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="mr-2 h-4 w-4 sm:h-6 sm:w-6 accent-blue-600 dark:accent-blue-400 rounded focus:ring-blue-400 border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              />
              <label htmlFor="isTimed" className="text-xs sm:text-lg font-medium text-blue-700 dark:text-blue-300 select-none">Тренировка на время</label>
            </div>

            {/* Кнопка "Начать диалог" */}
            <div className="text-center mt-4 sm:mt-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartDialog}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 xs:py-2 sm:py-4 px-3 xs:px-4 sm:px-12 rounded-xl text-xs xs:text-lg sm:text-2xl shadow-xl transition-all duration-200 w-full max-w-[120px] xs:max-w-xs sm:max-w-md min-w-[90px]"
              >
                Начать диалог
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Scenarios; 