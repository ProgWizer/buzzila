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
      <style>{noScrollbarStyle}</style>
      <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-12 flex flex-col items-center transition-colors">
        <h1 className="text-[64px] font-bold text-black dark:text-white mb-4 text-center font-['Inter'] transition-colors">Сценарии тренировок</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 text-center transition-colors">Выберите параметры для вашей тренировки</p>

        {scenarios.length === 0 ? (
          <div className="w-full max-w-4xl px-4 text-center text-gray-500 dark:text-gray-300 text-2xl transition-colors">
            Скоро здесь появятся новые сценарии!
          </div>
        ) : (
          <div className="w-full max-w-4xl px-4">
            {/* Секция выбора сферы */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3">Сфера</h2>
              <div className="relative flex items-center">
                <span className="scroll-shadow-left" />
                <button
                  onClick={() => scrollContainer('left', 'spheres-container')}
                  className="absolute left-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                </button>
                <div
                  id="spheres-container"
                  className="flex overflow-x-scroll no-scrollbar py-2 space-x-4 pr-10 pl-10 relative"
                >
                  {uniqueSpheres.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-300 text-lg transition-colors">Нет доступных сфер. Добавьте их в админ-панели.</p>
                  ) : (
                    uniqueSpheres.map(sphere => (
                      <motion.div
                        key={sphere.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-none p-6 border-2 border-transparent rounded-2xl shadow-lg cursor-pointer transition-all duration-200 transition-colors ${
                          selectedSphere === sphere.name
                            ? 'bg-[#e0edff] dark:bg-blue-700 text-blue-900 dark:text-white border-blue-500'
                            : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSphereSelect(sphere.name)}
                      >
                        <p className="text-lg font-medium text-blue-700 dark:text-blue-300">{sphere.name}</p>
                      </motion.div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => scrollContainer('right', 'spheres-container')}
                  className="absolute right-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                >
                  <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                </button>
                <span className="scroll-shadow-right" />
              </div>
            </div>

            {/* Секция выбора ситуации (появляется после выбора сферы) */}
            {selectedSphere && situationsBySphere[selectedSphere] && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3">Ситуация</h2>
                <div className="relative flex items-center">
                  <span className="scroll-shadow-left" />
                  <button
                    onClick={() => scrollContainer('left', 'situations-container')}
                    className="absolute left-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  >
                    <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                  </button>
                  <div
                    id="situations-container"
                    className="flex overflow-x-scroll no-scrollbar py-2 space-x-4 pr-10 pl-10 relative"
                  >
                    {situationsBySphere[selectedSphere].length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-300 text-lg transition-colors">Нет доступных ситуаций для этой сферы.</p>
                    ) : (
                      situationsBySphere[selectedSphere].map(situation => (
                        <motion.div
                          key={situation.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-none p-6 border-2 border-transparent rounded-2xl shadow-lg cursor-pointer transition-all duration-200 transition-colors ${
                            selectedSituation === situation.name
                              ? 'bg-[#e0edff] dark:bg-blue-700 text-blue-900 dark:text-white border-blue-500'
                              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => setSelectedSituation(situation.name)}
                        >
                          <p className="text-lg font-medium text-blue-700 dark:text-blue-300">{situation.name}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => scrollContainer('right', 'situations-container')}
                    className="absolute right-0 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  >
                    <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                  </button>
                  <span className="scroll-shadow-right" />
                </div>
              </div>
            )}

            {/* Секция выбора настроения */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3">Настроение собеседника</h2>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="block w-full max-w-md p-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100 text-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm transition-colors"
              >
                {uniqueMoods.map(mood => (
                  <option key={mood.value} value={mood.value}>{mood.label}</option>
                ))}
              </select>
            </div>

            {/* Секция выбора языка */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3">Язык</h2>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="block w-full max-w-md p-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100 text-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm transition-colors"
              >
                {uniqueLanguages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Секция выбора режима "на время" */}
            <div className="mb-12 flex items-center">
              <input
                type="checkbox"
                id="isTimed"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="mr-3 h-6 w-6 accent-blue-600 dark:accent-blue-400 rounded focus:ring-blue-400 border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              />
              <label htmlFor="isTimed" className="text-lg font-medium text-blue-700 dark:text-blue-300">Тренировка на время</label>
            </div>

            {/* Кнопка "Начать диалог" */}
            <div className="text-center mt-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartDialog}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-xl text-2xl shadow-xl transition-all duration-200"
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