import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    grid: isDark ? '#444' : '#e5e7eb',
    text: isDark ? '#fff' : '#111',
    bg1: isDark ? 'rgba(37,99,235,0.7)' : 'rgba(37,99,235,0.2)',
    bg2: isDark ? 'rgba(16,185,129,0.7)' : 'rgba(16,185,129,0.2)',
    bg3: isDark ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.2)',
    bg4: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(251,191,36,0.2)',
    bg5: isDark ? 'rgba(168,85,247,0.7)' : 'rgba(168,85,247,0.2)',
    bg6: isDark ? 'rgba(34,197,94,0.7)' : 'rgba(34,197,94,0.2)',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
  };
}

const ModeratorPanel = () => {
  const [loading, setLoading] = useState(true);
  // --- Достижения ---
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [errorAchievements, setErrorAchievements] = useState(null);
  const [showAddAchievementModal, setShowAddAchievementModal] = useState(false);
  const [achievementFormData, setAchievementFormData] = useState({
    title: '',
    description: '',
    icon: '',
    points: 0,
    is_repeatable: false,
    requirements: { type: 'none', value: '' }
  });
  const [showEditAchievementModal, setShowEditAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState({
    id: null,
    title: '',
    description: '',
    icon: '',
    points: 0,
    is_repeatable: false,
    requirements: { type: 'none', value: '' }
  });

  // --- Сценарии ---
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [errorScenarios, setErrorScenarios] = useState(null);
  const [showAddScenarioModal, setShowAddScenarioModal] = useState(false);
  const [scenarioFormData, setScenarioFormData] = useState({
    name: '',
    description: '',
    sphere: '',
    situation: '',
    mood: '',
    language: '',
    user_role: '',
    ai_role: '',
    ai_behavior: '',
    is_template: false,
  });
  const [showEditScenarioModal, setShowEditScenarioModal] = useState(false);
  const [currentScenario, setCurrentScenario] = useState({
    id: null,
    name: '',
    description: '',
    sphere: '',
    situation: '',
    mood: '',
    language: '',
    user_role: '',
    ai_role: '',
    ai_behavior: '',
    is_template: false,
  });

  // --- Статистика и графики ---
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [topScenarios, setTopScenarios] = useState(null);
  const [achievementsDist, setAchievementsDist] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [collapseStats, setCollapseStats] = useState(false);
  const [collapseCharts, setCollapseCharts] = useState(false);
  const [errorStats, setErrorStats] = useState(null);
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementSort, setAchievementSort] = useState('title');
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [scenarioSort, setScenarioSort] = useState('name');
  const [achievementPage, setAchievementPage] = useState(1);
  const achievementsPerPage = 5;
  const filteredAchievements = achievements
    .filter(a =>
      a.title.toLowerCase().includes(achievementSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(achievementSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (achievementSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  const paginatedAchievements = filteredAchievements.slice((achievementPage-1)*achievementsPerPage, achievementPage*achievementsPerPage);
  const achievementTotalPages = Math.ceil(filteredAchievements.length / achievementsPerPage);

  const [scenarioPage, setScenarioPage] = useState(1);
  const scenariosPerPage = 5;
  const filteredScenarios = scenarios
    .filter(s =>
      s.name.toLowerCase().includes(scenarioSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(scenarioSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (scenarioSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  const paginatedScenarios = filteredScenarios.slice((scenarioPage-1)*scenariosPerPage, scenarioPage*scenariosPerPage);
  const scenarioTotalPages = Math.ceil(filteredScenarios.length / scenariosPerPage);

  // --- Загрузка иконок ---
  const [availableIcons, setAvailableIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const fetchAvailableIcons = async () => {
    setLoadingIcons(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/upload/achievement_icons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableIcons(data.icons || []);
      } else {
        setAvailableIcons([]);
      }
    } catch (e) {
      setAvailableIcons([]);
    } finally {
      setLoadingIcons(false);
    }
  };

  // --- Модалки ---
  const [confirmModal, setConfirmModal] = useState({ show: false, onConfirm: null, text: '' });
  const [showScenarioDetailsModal, setShowScenarioDetailsModal] = useState(false);

  // --- useEffect для загрузки данных ---
  useEffect(() => {
    const fetchAchievements = async () => {
      setLoadingAchievements(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Ошибка загрузки достижений');
        setAchievements(await response.json());
        setErrorAchievements(null);
      } catch (e) {
        setErrorAchievements('Ошибка загрузки достижений');
      } finally {
        setLoadingAchievements(false);
      }
    };
    const fetchScenarios = async () => {
      setLoadingScenarios(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/scenarios', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Ошибка загрузки сценариев');
        setScenarios(await response.json());
        setErrorScenarios(null);
      } catch (e) {
        setErrorScenarios('Ошибка загрузки сценариев');
      } finally {
        setLoadingScenarios(false);
      }
    };
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setErrorStats(null);
        } else {
          setErrorStats('Не удалось загрузить статистику.');
        }
      } catch (e) {
        setErrorStats('Не удалось загрузить статистику. Попробуйте позже.');
      }
    };
    const fetchDailyStats = async () => {
      setLoadingCharts(true);
      const token = localStorage.getItem('access_token');
      let url = '/api/admin/stats/daily';
      if (dateFrom && dateTo) url += `?from=${dateFrom}&to=${dateTo}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setDailyStats(data);
      }
      setLoadingCharts(false);
    };
    const fetchTopScenarios = async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/admin/stats/top-scenarios', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setTopScenarios(await response.json());
    };
    const fetchAchievementsDist = async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/admin/stats/achievements-distribution', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setAchievementsDist(await response.json());
    };
    fetchAchievements();
    fetchScenarios();
    fetchStats();
    fetchDailyStats();
    fetchTopScenarios();
    fetchAchievementsDist();
    fetchAvailableIcons();
  }, [dateFrom, dateTo]);

  // --- Обработчики для достижений ---
  const handleAddAchievementChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'requirementType' || name === 'requirementValue') {
      setAchievementFormData(prevData => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [name.replace('requirement', '').toLowerCase()]: value
        }
      }));
    } else {
      setAchievementFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleEditAchievementChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'requirementType' || name === 'requirementValue') {
      setCurrentAchievement(prevData => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [name.replace('requirement', '').toLowerCase()]: value
        }
      }));
    } else {
      setCurrentAchievement(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleIconUpload = async (event, isEditForm = false) => {
    const file = event.target.files[0];
    if (!file) return;
    // Локальный preview (опционально)
    // ... можно добавить превью ...
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');
      const response = await fetch('/api/upload/achievement_icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось загрузить иконку.');
      }
      const data = await response.json();
      const newIconUrl = data.url;
      if (isEditForm) {
        setCurrentAchievement(prevData => ({ ...prevData, icon: newIconUrl }));
      } else {
        setAchievementFormData(prevData => ({ ...prevData, icon: newIconUrl }));
      }
      toast.success('Иконка успешно загружена!');
    } catch (err) {
      toast.error(`Ошибка при загрузке иконки: ${err.message}`);
    }
  };

  const handleEditAchievementClick = (achievement) => {
    let parsedRequirements = { type: 'none', value: '' };
    if (achievement.requirements) {
      try {
        const req = typeof achievement.requirements === 'string' ? JSON.parse(achievement.requirements) : achievement.requirements;
        if (req && req.type && req.value !== undefined) {
          parsedRequirements = { type: req.type, value: String(req.value) };
        }
      } catch (e) {}
    }
    setCurrentAchievement({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon || '',
      points: achievement.points || 0,
      is_repeatable: achievement.is_repeatable || false,
      requirements: parsedRequirements
    });
    setShowEditAchievementModal(true);
  };

  const handleSaveAchievementEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');
      setLoadingAchievements(true);
      const response = await fetch(`/api/achievements/${currentAchievement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentAchievement.title,
          description: currentAchievement.description,
          icon: currentAchievement.icon,
          points: parseInt(currentAchievement.points, 10),
          is_repeatable: currentAchievement.is_repeatable,
          requirements: currentAchievement.requirements.type !== 'none' ? currentAchievement.requirements : {}
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить достижение.');
      }
      toast.success('Достижение успешно обновлено!');
      setShowEditAchievementModal(false);
      // обновить список достижений
      const achievementsRes = await fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
      setAchievements(await achievementsRes.json());
    } catch (err) {
      setErrorAchievements(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const handleAddAchievementSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');
      setLoadingAchievements(true);
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...achievementFormData,
          points: parseInt(achievementFormData.points, 10),
          is_repeatable: achievementFormData.is_repeatable,
          requirements: achievementFormData.requirements.type !== 'none' ? achievementFormData.requirements : {}
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось добавить достижение.');
      }
      toast.success('Достижение успешно добавлено!');
      setShowAddAchievementModal(false);
      setAchievementFormData({ title: '', description: '', icon: '', points: 0, is_repeatable: false, requirements: { type: 'none', value: '' } });
      // обновить список достижений
      const achievementsRes = await fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
      setAchievements(await achievementsRes.json());
    } catch (err) {
      setErrorAchievements(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    setConfirmModal({
      show: true,
      text: 'Вы уверены, что хотите удалить это достижение?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) throw new Error('Токен авторизации не найден.');
          setLoadingAchievements(true);
          const response = await fetch(`/api/achievements/${achievementId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось удалить достижение.');
          }
          toast.success('Достижение успешно удалено!');
          // обновить список достижений
          const achievementsRes = await fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
          setAchievements(await achievementsRes.json());
        } catch (err) {
          setErrorAchievements(err.message);
          toast.error(`Ошибка: ${err.message}`);
        } finally {
          setLoadingAchievements(false);
          setConfirmModal({ show: false, onConfirm: null, text: '' });
        }
      }
    });
  };

  // --- Обработчики для сценариев ---
  const handleAddScenarioSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');
      setLoadingScenarios(true);
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось добавить сценарий.');
      }
      toast.success('Сценарий успешно добавлен!');
      setShowAddScenarioModal(false);
      setScenarioFormData({ name: '', description: '', sphere: '', situation: '', mood: '', language: '', user_role: '', ai_role: '', ai_behavior: '', is_template: false });
      // обновить список сценариев
      const scenariosRes = await fetch('/api/scenarios', { headers: { 'Authorization': `Bearer ${token}` } });
      setScenarios(await scenariosRes.json());
    } catch (err) {
      setErrorScenarios(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleEditScenarioClick = (scenario) => {
    setCurrentScenario({ ...scenario });
    setShowEditScenarioModal(true);
  };

  const handleSaveScenarioEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');
      setLoadingScenarios(true);
      const response = await fetch(`/api/scenarios/${currentScenario.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentScenario),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить сценарий.');
      }
      toast.success('Сценарий успешно обновлён!');
      setShowEditScenarioModal(false);
      // обновить список сценариев
      const scenariosRes = await fetch('/api/scenarios', { headers: { 'Authorization': `Bearer ${token}` } });
      setScenarios(await scenariosRes.json());
    } catch (err) {
      setErrorScenarios(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    setConfirmModal({
      show: true,
      text: 'Вы уверены, что хотите удалить этот сценарий?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) throw new Error('Токен авторизации не найден.');
          setLoadingScenarios(true);
          const response = await fetch(`/api/scenarios/${scenarioId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось удалить сценарий.');
          }
          toast.success('Сценарий успешно удалён!');
          // обновить список сценариев
          const scenariosRes = await fetch('/api/scenarios', { headers: { 'Authorization': `Bearer ${token}` } });
          setScenarios(await scenariosRes.json());
        } catch (err) {
          setErrorScenarios(err.message);
          toast.error(`Ошибка: ${err.message}`);
        } finally {
          setLoadingScenarios(false);
          setConfirmModal({ show: false, onConfirm: null, text: '' });
        }
      }
    });
  };

  // --- JSX рендер: полностью копирую layout и стили из Admin.jsx, ---
  return (
    <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-6 sm:py-12 flex flex-col items-center transition-all overflow-x-hidden">
      {/* Унификация стилей для секций */}
      <style>{`
        .panel-section {
          background: var(--tw-bg-opacity,1) #fff;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          border: 1.5px solid #e5e7eb;
          padding: 18px 10px 18px 10px;
          margin-bottom: 18px;
          transition: box-shadow 0.2s, border 0.2s, background 0.2s;
          max-width: 100%;
          overflow-x: auto;
        }
        .dark .panel-section {
          background: #181f2a;
          border-color: #374151;
        }
        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .panel-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d47a1;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .dark .panel-title {
          color: #b3cfff;
        }
        .panel-icon {
          width: 32px;
          height: 32px;
          color: #2563eb;
        }
        .dark .panel-icon {
          color: #60a5fa;
        }
        .panel-btn {
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 0;
          min-width: 120px;
          min-height: 44px;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          outline: none;
        }
        .panel-btn:active {
          box-shadow: 0 1px 2px rgba(0,0,0,0.10);
        }
        .panel-btn-primary {
          background: #0ea5e9;
          color: #fff;
        }
        .panel-btn-primary:hover {
          background: #0369a1;
        }
        .panel-btn-secondary {
          background: #e0e7ef;
          color: #0d47a1;
        }
        .panel-btn-secondary:hover {
          background: #b3cfff;
        }
        .dark .panel-btn-secondary {
          background: #232b3a;
          color: #b3cfff;
        }
        .panel-table {
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          margin-bottom: 8px;
          font-size: 15px;
          line-height: 1.4;
          background: #fff;
          color: #1a202c;
        }
        .dark .panel-table {
          background: #181f2a;
          color: #f3f4f6;
        }
        .panel-table th, .panel-table td {
          padding: 13px 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .panel-table th {
          font-weight: 700;
          background: #f1f8ff;
          color: #0d47a1;
        }
        .dark .panel-table th {
          background: #232b3a;
          color: #b3cfff;
        }
        @media (max-width: 640px) {
          .panel-section { padding: 10px 2px 10px 2px; border-radius: 12px; }
          .panel-title { font-size: 1.1rem; }
          .panel-table th, .panel-table td { padding: 9px 7px; font-size: 13.5px; max-width: 90px; }
          .panel-btn { font-size: 14px !important; padding: 12px 0 !important; min-width: 90px !important; min-height: 40px !important; }
        }
      `}</style>
    
      {/* Хлебные крошки */}
      <nav className="w-full max-w-[1200px] mb-1 sm:mb-4 text-xs sm:text-sm">
        <ol className="flex flex-wrap items-center space-x-1 sm:space-x-2 text-gray-400 dark:text-gray-400 break-words">
          <li>
            <a href="/" className="hover:underline text-blue-400 dark:text-blue-300">Главная</a>
          </li>
          <li>/</li>
          <li className="text-gray-200 font-semibold">Модератор-панель</li>
        </ol>
      </nav>
      {/* Крупный заголовок */}
      <h1 className="text-lg sm:text-3xl md:text-5xl lg:text-[48px] font-bold text-gray-900 dark:text-white mb-1 sm:mb-4 text-center font-['Inter'] drop-shadow-lg transition-colors break-words leading-tight">Модератор-панель</h1>
      <p className="text-xs sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-3 sm:mb-10 text-center break-words">Управление достижениями, сценариями и аналитикой</p>
      <div className="w-full max-w-full md:max-w-[900px] flex flex-col gap-3 sm:gap-8 mb-4 sm:mb-12 px-0.5 sm:px-2 md:px-0">
        {/* Карточка достижений */}
        <div className="panel-section">
          <div className="panel-header">
            <ChartBarIcon className="panel-icon w-6 h-6 sm:w-12 sm:h-12 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="panel-title text-base sm:text-3xl font-extrabold text-blue-900 dark:text-blue-200">Достижения</span>
          </div>
          {/* Поиск и сортировка */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
              <input
                type="text"
                placeholder="Поиск по названию или описанию"
              className="border border-gray-400 dark:border-gray-700 rounded-[8px] px-2 py-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 w-full sm:w-64 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors text-xs sm:text-base"
                value={achievementSearch}
                onChange={e => setAchievementSearch(e.target.value)}
              />
              <button
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${achievementSort === 'title' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'} hover:bg-blue-600 dark:hover:bg-blue-600 text-xs sm:text-base`}
                onClick={() => setAchievementSort('title')}
              style={{ minWidth: '90px' }}
              >
                Сортировать по названию
              </button>
              <button 
                onClick={() => setShowAddAchievementModal(true)}
              className="bg-green-500 text-white rounded-[8px] px-2 py-1.5 hover:bg-green-700 transition min-w-[90px] text-xs sm:text-base"
              >
                Добавить новое достижение
              </button>
          </div>
          {/* Таблица достижений */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-[11px] sm:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Название</th>
                  <th className="px-2 py-2 font-semibold">Описание</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Требование</th>
                  <th className="px-2 py-2 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loadingAchievements ? (
                  <tr><td colSpan="4" className="px-4 py-2 text-center">Загрузка достижений...</td></tr>
                ) : errorAchievements ? (
                  <tr><td colSpan="4" className="px-4 py-2 text-center text-red-600">Ошибка: {errorAchievements}</td></tr>
                ) : achievements.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-2 text-center">Нет доступных достижений.</td></tr>
                ) : (
                  paginatedAchievements.map((achievement, idx) => {
                    let req = achievement.requirements;
                    if (typeof req === 'string') {
                      try { req = JSON.parse(req); } catch { req = {}; }
                    }
                    let reqText = 'Нет требования';
                    if (req && req.type === 'total_dialogs') reqText = `Завершить ${req.value} диалогов`;
                    else if (req && req.type === 'time') reqText = `Потратить ${req.value} секунд`;
                    return (
                      <tr
                        key={achievement.id}
                        className={`border-t border-gray-100 dark:border-gray-700 transition ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900/80' : 'bg-gray-50 dark:bg-gray-900/60'} hover:bg-[#F1F8FF] dark:hover:bg-gray-800/70`}
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{achievement.title}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{achievement.description}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{reqText}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2 items-center">
                            <button 
                              onClick={() => handleEditAchievementClick(achievement)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Редактировать
                            </button>
                            <button 
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="bg-red-500 hover:bg-red-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              Удалить
                            </button>
                            <button 
                              onClick={() => (achievement)}
                              className="bg-gray-500 hover:bg-gray-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                            >
                              <UserGroupIcon className="w-4 h-4 mr-1" />
                              Назначить
                            </button>
                            <button 
                              onClick={() => (achievement)}
                              className="bg-gray-500 hover:bg-gray-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                            >
                              <UserGroupIcon className="w-4 h-4 mr-1" />
                              Назначить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Пагинация */}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setAchievementPage(p => Math.max(1, p-1))} disabled={achievementPage===1} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Назад</button>
            {[...Array(achievementTotalPages)].map((_,i) => (
              <button key={i} onClick={()=>setAchievementPage(i+1)} className={`px-3 py-1 rounded ${achievementPage===i+1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>{i+1}</button>
            ))}
            <button onClick={() => setAchievementPage(p => Math.min(achievementTotalPages, p+1))} disabled={achievementPage===achievementTotalPages} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Вперёд</button>
          </div>
        </div>
        {/* Карточка сценариев */}
        <div className="panel-section">
          <div className="panel-header">
            <ChartBarIcon className="panel-icon w-12 h-12 text-blue-800 dark:text-blue-300 mr-4" />
            <span className="panel-title text-3xl font-extrabold text-blue-900 dark:text-blue-200">Сценарии</span>
          </div>
          {/* Поиск и сортировка */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="text"
                placeholder="Поиск по названию или описанию"
                className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-3 py-2 text-base focus:outline-none focus:border-[#0D47A1] dark:focus:border-blue-400 w-full sm:w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors"
                value={scenarioSearch}
                onChange={e => setScenarioSearch(e.target.value)}
              />
              <button
                className={`px-5 py-2 rounded-lg font-semibold transition ${scenarioSort === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-700`}
                onClick={() => setScenarioSort('name')}
                style={{ minWidth: '180px' }}
              >
                Сортировать по названию
              </button>
              <button 
                onClick={() => setShowAddScenarioModal(true)}
                className="bg-green-500 text-white rounded-[8px] px-4 py-2 hover:bg-green-700 transition min-w-[180px]"
              >
                Добавить новый сценарий
              </button>
            </div>
          </div>
          {/* Таблица сценариев */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-4">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs md:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Название</th>
                  <th className="px-2 py-2 font-semibold">Описание</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Сфера</th>
                  <th className="px-2 py-2 font-semibold hidden sm:table-cell">Ситуация</th>
                  <th className="px-2 py-2 font-semibold hidden md:table-cell">Шаблон</th>
                  <th className="px-2 py-2 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loadingScenarios ? (
                  <tr><td colSpan="6" className="px-4 py-2 text-center">Загрузка сценариев...</td></tr>
                ) : errorScenarios ? (
                  <tr><td colSpan="6" className="px-4 py-2 text-center text-red-600">Ошибка: {errorScenarios}</td></tr>
                ) : scenarios.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-2 text-center text-gray-400 dark:text-gray-500">Нет доступных сценариев.</td></tr>
                ) : (
                  paginatedScenarios.map((scenario, idx) => (
                    <tr
                      key={scenario.id}
                      className={`border-t border-gray-100 dark:border-gray-700 transition ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900/80' : 'bg-gray-50 dark:bg-gray-900/60'} hover:bg-[#F1F8FF] dark:hover:bg-gray-800/70`}
                    >
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{scenario.name}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{scenario.description}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{scenario.sphere}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{scenario.situation}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden md:table-cell">{scenario.is_template ? 'Да' : 'Нет'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 items-center">
                          <button 
                            onClick={() => handleEditScenarioClick(scenario)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Редактировать
                          </button>
                          <button 
                            onClick={() => handleDeleteScenario(scenario.id)}
                            className="bg-red-500 hover:bg-red-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Пагинация */}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setScenarioPage(p => Math.max(1, p-1))} disabled={scenarioPage===1} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Назад</button>
            {[...Array(scenarioTotalPages)].map((_,i) => (
              <button key={i} onClick={()=>setScenarioPage(i+1)} className={`px-3 py-1 rounded ${scenarioPage===i+1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>{i+1}</button>
            ))}
            <button onClick={() => setScenarioPage(p => Math.min(scenarioTotalPages, p+1))} disabled={scenarioPage===scenarioTotalPages} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Вперёд</button>
          </div>
        </div>
      </div>
      {/* Блок статистики и графиков */}
      <div id="moderator-stats" className="w-full max-w-[900px] mt-4 md:mt-6 px-2 sm:px-4 md:px-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100 transition-colors">Статистика</h2>
        <div className="flex gap-2 mb-4 md:hidden">
          <button onClick={() => setCollapseStats(v => !v)} className="px-3 py-1 rounded bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-blue-200 font-semibold">{collapseStats ? 'Показать' : 'Скрыть'} метрики</button>
          <button onClick={() => setCollapseCharts(v => !v)} className="px-3 py-1 rounded bg-green-100 dark:bg-gray-700 text-green-900 dark:text-green-200 font-semibold">{collapseCharts ? 'Показать' : 'Скрыть'} графики</button>
        </div>
        {/* Карточки статистики */}
        {!collapseStats && (
          errorStats ? (
            <div className="text-center text-red-500 py-4 animate-fade-in">{errorStats}</div>
          ) : stats ? (
            Object.keys(stats).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-8 animate-fade-in">
                {Object.entries(stats).map(([key, value]) => {
                  const statLabels = {
                    total_dialogs: 'Всего диалогов',
                    total_scenarios: 'Всего сценариев',
                    total_achievements: 'Всего достижений',
                    total_users: 'Всего пользователей',
                    active_users: 'Активных пользователей',
                    admins: 'Администраторов',
                    managers: 'Модераторов',
                  };
                  return (
                    <div key={key} className="p-4 rounded-xl text-center shadow transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                      <div className="text-gray-700 dark:text-gray-300">{statLabels[key] || key}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных для отображения статистики</div>
            )
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных для отображения статистики</div>
          )
        )}
        {/* Графики */}
        {!collapseCharts && <>
          {/* Line: динамика диалогов (без пользователей) */}
          {dailyStats && Array.isArray(dailyStats.dates) && Array.isArray(dailyStats.dialogs_per_day) && dailyStats.dates.length > 0 ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in min-h-[260px] sm:min-h-[340px]">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Динамика диалогов (30 дней)</h2>
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                <b>Как пользоваться:</b> Выберите период дат и нажмите "Показать". График отобразит завершённые диалоги по дням.
              </div>
              <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
                <label className="text-gray-700 dark:text-gray-300">Период:</label>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100" />
                <span className="text-gray-500 dark:text-gray-400">—</span>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100" />
                <button onClick={() => {
                  setLoadingCharts(true);
                  const token = localStorage.getItem('access_token');
                  let url = '/api/admin/stats/daily';
                  if (dateFrom && dateTo) url += `?from=${dateFrom}&to=${dateTo}`;
                  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(res => res.ok ? res.json() : Promise.reject())
                    .then(data => setDailyStats(data))
                    .finally(() => setLoadingCharts(false));
                }} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 transition">Показать</button>
              </div>
              {loadingCharts && <div className="text-center text-blue-500 py-4 animate-pulse">Загрузка данных...</div>}
              <div className="w-full min-w-[340px]">
              <Line
                data={{
                    labels: dailyStats.dates.map((d, i) => i % 2 === 0 ? d : ''),
                  datasets: [
                    {
                      label: 'Завершённые диалоги',
                      data: dailyStats.dialogs_per_day,
                      borderColor: getChartColors().bg2,
                      backgroundColor: getChartColors().bg2,
                      tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  animation: { duration: 1200, easing: 'easeInOutQuart' },
                  plugins: {
                      legend: { position: 'top', labels: { color: getChartColors().text, font: { size: 14 } } },
                    title: { display: false },
                  },
                  scales: {
                      x: { title: { display: true, text: 'Дата', color: getChartColors().text }, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                      y: { title: { display: true, text: 'Количество', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                  },
                }}
              />
              </div>
            </div>
          ) : dailyStats && (
            <div className="text-center text-red-500 py-8 animate-fade-in">
              Ошибка: данные для графика некорректны или пусты.<br/>
              Проверьте, что выбран правильный период и на сервере есть данные.<br/>
              <pre className="text-xs text-gray-400 mt-2">{JSON.stringify(dailyStats, null, 2)}</pre>
            </div>
          )}
          {/* Bar: топ-5 популярных сценариев */}
          {topScenarios ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-8 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="w-full md:w-2/3 flex-shrink-0">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center md:text-left">График сценариев</h2>
                <Bar
                  data={{
                    labels: topScenarios.labels,
                    datasets: [{
                      label: 'Количество диалогов',
                      data: topScenarios.counts,
                      backgroundColor: getChartColors().bg1,
                      borderRadius: 8,
                      maxBarThickness: 40,
                    }],
                  }}
                  options={{
                    responsive: true,
                    animation: { duration: 1200, easing: 'easeInOutQuart' },
                    plugins: { legend: { display: false, labels: { color: getChartColors().text } } },
                    indexAxis: 'x',
                    scales: {
                      x: { title: { display: false }, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                      y: { title: { display: true, text: 'Диалогов', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                    },
                  }}
                />
              </div>
              <div className="w-full md:w-1/3 flex flex-col items-center md:items-start mt-8 md:mt-0">
                <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-200 text-center md:text-left">Статистика</h3>
                <div className="w-full flex flex-col gap-2">
                  <div className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">{topScenarios.labels.length} сценариев</div>
                  {topScenarios.labels.map((label, idx) => {
                    const count = topScenarios.counts[idx];
                    const max = Math.max(...topScenarios.counts);
                    const percent = max > 0 ? Math.round((count / max) * 100) : 0;
                    return (
                      <div key={label} className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-xl shadow transition"
                  onClick={() => setShowScenarioDetailsModal({ show: true, title: 'Детали по сценариям', details: { type: 'scenario', label: 'Все сценарии' } })}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных по сценариям</div>
          )}
          {/* Bar: распределение достижений */}
          {achievementsDist ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Распределение достижений</h2>
              <Bar
                data={{
                  labels: achievementsDist.labels,
                  datasets: [{
                    label: 'Пользователей с достижением',
                    data: achievementsDist.counts,
                    backgroundColor: [getChartColors().bg2, getChartColors().bg3, getChartColors().bg4, getChartColors().bg5, getChartColors().bg6],
                  }],
                }}
                options={{
                  responsive: true,
                  animation: { duration: 1200, easing: 'easeInOutQuart' },
                  plugins: { legend: { display: false, labels: { color: getChartColors().text } } },
                  indexAxis: 'y',
                  scales: {
                    x: { title: { display: true, text: 'Пользователей', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                    y: { title: { display: true, text: 'Достижение', color: getChartColors().text }, ticks: { color: getChartColors().text, font: { size: 12 } }, grid: { color: getChartColors().grid } },
                  },
                  onClick: (evt, elements) => {
                    if (elements.length > 0) {
                      const index = elements[0].index;
                      const label = achievementsDist.labels[index];
                      setShowScenarioDetailsModal({ show: true, title: `Достижение: ${label}`, details: { type: 'achievement', label } });
                    }
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных по достижениям</div>
          )}
        </>}
        {/* Модальное окно подробностей по сценариям */}
        {showScenarioDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-2 relative animate-fade-in">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setShowScenarioDetailsModal(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Детали по сценариям</h3>
              <div className="max-h-[60vh] overflow-y-auto">
                {topScenarios && topScenarios.labels.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-blue-900 dark:text-blue-200">
                        <th className="py-2 pr-4">Сценарий</th>
                        <th className="py-2 pr-4">Диалогов</th>
                        <th className="py-2">% от максимума</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topScenarios.labels.map((label, idx) => {
                        const count = topScenarios.counts[idx];
                        const max = Math.max(...topScenarios.counts);
                        const percent = max > 0 ? Math.round((count / max) * 100) : 0;
                        return (
                          <tr key={label} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-100">{label}</td>
                            <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{count}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <span>{percent}%</span>
                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-400">Нет данных по сценариям</div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                  onClick={() => setShowScenarioDetailsModal(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Модальные окна для CRUD достижений и сценариев, подтверждения удаления */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors relative animate-fade-in">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Добавить новое достижение</h2>
              <button onClick={() => setShowAddAchievementModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 sm:p-2">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAchievementSubmit} className="space-y-2 sm:space-y-4">
              <div>
                <label htmlFor="achievement-title" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Название:</label>
                <input
                  type="text"
                  id="achievement-title"
                  name="title"
                  value={achievementFormData.title}
                  onChange={handleAddAchievementChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="achievement-description" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Описание:</label>
                <textarea
                  id="achievement-description"
                  name="description"
                  value={achievementFormData.description}
                  onChange={handleAddAchievementChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none transition-colors"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Иконка:</label>
                <div className="flex gap-2 items-center">
                  {/* ...иконка превью и загрузка... */}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.svg"
                    onChange={e => handleIconUpload(e, false)}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="achievement-points" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Баллы:</label>
                <input
                  type="number"
                  id="achievement-points"
                  name="points"
                  value={achievementFormData.points}
                  onChange={handleAddAchievementChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="achievement-is-repeatable"
                  name="is_repeatable"
                  checked={achievementFormData.is_repeatable}
                  onChange={handleAddAchievementChange}
                  className="mr-2 leading-tight accent-blue-600 dark:accent-blue-400"
                />
                <label htmlFor="achievement-is-repeatable" className="text-gray-700 dark:text-gray-200 text-sm font-bold">Повторяемое</label>
              </div>
              <div className="mb-4">
                <label htmlFor="achievement-requirements-type" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Тип требования:</label>
                <select
                  id="achievement-requirements-type"
                  name="requirementType"
                  value={achievementFormData.requirements.type}
                  onChange={handleAddAchievementChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline mb-2 transition-colors"
                >
                  <option value="none">Нет</option>
                  <option value="total_dialogs">Завершить диалогов</option>
                  <option value="time">Время (секунд)</option>
                </select>
                {achievementFormData.requirements.type === 'time' ? (
                  <div>
                    <label htmlFor="achievement-requirements-value" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Время (секунд):</label>
                    <input
                      type="number"
                      id="achievement-requirements-value"
                      name="requirementValue"
                      value={achievementFormData.requirements.value}
                      onChange={handleAddAchievementChange}
                      className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                      placeholder="Введите время в секундах"
                    />
                  </div>
                ) : achievementFormData.requirements.type !== 'none' ? (
                  <div>
                    <label htmlFor="achievement-requirements-value" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Значение:</label>
                    <input
                      type="number"
                      id="achievement-requirements-value"
                      name="requirementValue"
                      value={achievementFormData.requirements.value}
                      onChange={handleAddAchievementChange}
                      className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                      placeholder="Введите числовое значение"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAchievementModal(false);
                    setAchievementFormData({ title: '', description: '', icon: '', points: 0, is_repeatable: false, requirements: { type: 'none', value: '' } });
                  }}
                  className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 w-full rounded transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 w-full rounded transition-colors"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditAchievementModal && currentAchievement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold">Редактировать достижение: {currentAchievement.title}</h2>
              <button onClick={() => setShowEditAchievementModal(false)} className="text-gray-500 hover:text-gray-700 p-1 sm:p-2">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAchievementEdit} className="space-y-2 sm:space-y-4">
              {/* ...поля формы для редактирования достижения... */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button type="button" onClick={() => setShowEditAchievementModal(false)} className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 w-full rounded transition-colors">Отмена</button>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 w-full rounded transition-colors">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddScenarioModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors relative animate-fade-in">
            <div className="flex justify-between items-center mb-2 sm:mb-6">
              <h2 className="panel-title text-gray-900 dark:text-gray-100">Добавить новый сценарий</h2>
              <button onClick={() => setShowAddScenarioModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 sm:p-2 transition-colors">
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            <form onSubmit={handleAddScenarioSubmit} className="space-y-2 sm:space-y-6">
              <div>
                <label htmlFor="scenario-title" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Название:</label>
                <input type="text" id="scenario-title" name="title" value={scenarioFormData.name} onChange={e => setScenarioFormData({ ...scenarioFormData, name: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Введите название сценария" />
              </div>
              <div>
                <label htmlFor="scenario-description" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Описание:</label>
                <textarea id="scenario-description" name="description" value={scenarioFormData.description} onChange={e => setScenarioFormData({ ...scenarioFormData, description: e.target.value })} className="w-full min-h-[60px] h-24 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm resize-none" required placeholder="Введите описание сценария"></textarea>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700/40 pb-4 mb-2"></div>
              <div>
                <label htmlFor="scenario-sphere" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Сфера:</label>
                <input type="text" id="scenario-sphere" name="sphere" value={scenarioFormData.sphere} onChange={e => setScenarioFormData({ ...scenarioFormData, sphere: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: Работа, Учёба, Личная жизнь" />
              </div>
              <div>
                <label htmlFor="scenario-situation" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Ситуация:</label>
                <input type="text" id="scenario-situation" name="situation" value={scenarioFormData.situation} onChange={e => setScenarioFormData({ ...scenarioFormData, situation: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: Собеседование, Переговоры" />
              </div>
              <div>
                <label htmlFor="scenario-mood" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Настроение:</label>
                <input type="text" id="scenario-mood" name="mood" value={scenarioFormData.mood} onChange={e => setScenarioFormData({ ...scenarioFormData, mood: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: Нейтральное, Позитивное, Агрессивное" />
              </div>
              <div>
                <label htmlFor="scenario-language" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Язык:</label>
                <input type="text" id="scenario-language" name="language" value={scenarioFormData.language} onChange={e => setScenarioFormData({ ...scenarioFormData, language: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: Русский, Английский" />
              </div>
              <div>
                <label htmlFor="scenario-user-role" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Роль пользователя:</label>
                <input type="text" id="scenario-user-role" name="user_role" value={scenarioFormData.user_role} onChange={e => setScenarioFormData({ ...scenarioFormData, user_role: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: клиент, сотрудник" />
              </div>
              <div>
                <label htmlFor="scenario-ai-role" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Роль AI:</label>
                <input type="text" id="scenario-ai-role" name="ai_role" value={scenarioFormData.ai_role} onChange={e => setScenarioFormData({ ...scenarioFormData, ai_role: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm" required placeholder="Например: администратор отеля, менеджер" />
              </div>
              <div>
                <label htmlFor="scenario-ai-behavior" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Поведение AI:</label>
                <textarea id="scenario-ai-behavior" name="ai_behavior" value={scenarioFormData.ai_behavior} onChange={e => setScenarioFormData({ ...scenarioFormData, ai_behavior: e.target.value })} className="w-full min-h-[48px] h-20 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm resize-none" required placeholder="Например: недовольный клиент, спокойный сотрудник"></textarea>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="scenario-is-template" name="is_template" checked={scenarioFormData.is_template} onChange={e => setScenarioFormData({ ...scenarioFormData, is_template: e.target.checked })} className="mr-2 leading-tight accent-blue-600 dark:accent-blue-400" />
                <label htmlFor="scenario-is-template" className="text-gray-700 dark:text-gray-300 text-base">Является шаблоном (не будет отображаться для пользователей)</label>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowAddScenarioModal(false)} className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 px-6 rounded-xl transition-colors shadow">Отмена</button>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditScenarioModal && currentScenario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold">Редактировать сценарий: {currentScenario.name}</h2>
              <button onClick={() => setShowEditScenarioModal(false)} className="text-gray-500 hover:text-gray-700 p-1 sm:p-2">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveScenarioEdit} className="space-y-2 sm:space-y-4">
              {/* ...поля формы для редактирования сценария... */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button type="button" onClick={() => setShowEditScenarioModal(false)} className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 w-full rounded transition-colors">Отмена</button>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 w-full rounded transition-colors">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-[95vw] sm:max-w-sm">
            <div className="mb-2 sm:mb-4 text-base sm:text-lg font-semibold text-gray-800">{confirmModal.text}</div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 w-full sm:w-auto rounded" onClick={() => setConfirmModal({ show: false, onConfirm: null, text: '' })}>Отмена</button>
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 w-full sm:w-auto rounded" onClick={confirmModal.onConfirm}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorPanel;