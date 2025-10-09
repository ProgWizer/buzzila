import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
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
  BarElement,   // для Bar
  ArcElement,   // для Pie
  Title,
  Tooltip,
  Legend
);

// Функция для определения цветов графиков в зависимости от темы
function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    grid: isDark ? '#444' : '#e5e7eb',
    text: isDark ? '#fff' : '#111',
    bg1: isDark ? 'rgba(37,99,235,0.7)' : 'rgba(37,99,235,0.2)', // blue
    bg2: isDark ? 'rgba(16,185,129,0.7)' : 'rgba(16,185,129,0.2)', // green
    bg3: isDark ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.2)', // red
    bg4: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(251,191,36,0.2)', // yellow
    bg5: isDark ? 'rgba(168,85,247,0.7)' : 'rgba(168,85,247,0.2)', // purple
    bg6: isDark ? 'rgba(34,197,94,0.7)' : 'rgba(34,197,94,0.2)', // green
    card: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
  };
}

const Admin = () => {
  // 1. useState (все состояния)
  const navigate = useNavigate();
  // Универсальный fetch с токеном и обработкой 401
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      toast.error('Сессия истекла. Войдите заново.');
      navigate('/login');
      throw new Error('Unauthorized');
    }
    return res;
  };
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Пользователь для редактирования
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: '',
    is_active: false,
  });

  // Состояния для поиска и пагинации
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Количество пользователей на страницу
  const [filteredUsers, setFilteredUsers] = useState([]); // Отфильтрованные пользователи

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ МОДЕРАТОРОВ
  const [moderators, setModerators] = useState([]);
  const [moderatorsSearchQuery, setModeratorsSearchQuery] = useState('');
  const [filteredModerators, setFilteredModerators] = useState([]);

  // Состояния для управления достижениями
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
  }); // Достижение для добавления

  // Состояния для управления редактированием достижений
  const [showEditAchievementModal, setShowEditAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState({
    id: null,
    title: '',
    description: '',
    icon: '',
    points: 0,
    is_repeatable: false,
    requirements: { type: 'none', value: '' }
  }); // Достижение для редактирования

  // Состояния для управления назначением достижений пользователям
  const [showAssignAchievementModal, setShowAssignAchievementModal] = useState(false);
  const [selectedAchievementForAssignment, setSelectedAchievementForAssignment] = useState(null);
  const [usersWithAchievement, setUsersWithAchievement] = useState([]);
  const [availableUsersForAssignment, setAvailableUsersForAssignment] = useState([]);

  // Состояния для работы с иконками
  const [availableIcons, setAvailableIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  //  Состояния для управления сценариями
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
    prompt_template_id: null,
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
    prompt_template_id: null,
  });

  // Состояние модалки шаблонов системных промптов
  const [showPromptTemplatesModal, setShowPromptTemplatesModal] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [promptTemplateForm, setPromptTemplateForm] = useState({
    name: '',
    description: '',
    prompt: '', // Упрощенная форма - только основной промпт
  });
  const [activePromptTemplateId, setActivePromptTemplateId] = useState(null);
  // Состояния синхронизации привязки шаблонов к сценариям
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Привязка шаблонов к сценариям: карта scenarioId -> templateId и контекст открытой модалки
  const [scenarioTemplateMap, setScenarioTemplateMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scenarioTemplateMap') || '{}'); } catch { return {}; }
  });
  const [templateScenarioContext, setTemplateScenarioContext] = useState(null);
  
  // Состояние для редактирования содержимого шаблона
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    id: null,
    name: '',
    description: '',
    prompt: '',
  });
  const [editingTemplateReadOnly, setEditingTemplateReadOnly] = useState(false);

  // Состояния предпросмотра системного промпта
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResult, setPreviewResult] = useState('');
  const [previewAnalysisResult, setPreviewAnalysisResult] = useState('');

  // Валидация шаблона (минимальная)
  const validateTemplate = (tpl) => {
    const errors = [];
    if (!((tpl.content_start && tpl.content_start.trim()) || (tpl.content_continue && tpl.content_continue.trim()))) {
      errors.push('Укажите content_start или content_continue');
    }
    if (tpl.sections_json) {
      try {
        const j = typeof tpl.sections_json === 'string' ? JSON.parse(tpl.sections_json) : tpl.sections_json;
        if (j && typeof j !== 'object') errors.push('sections_json должен быть объектом');
      } catch (e) {
        errors.push('sections_json должен быть валидным JSON');
      }
    }
    return errors;
  };

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

  const [confirmModal, setConfirmModal] = useState({ show: false, onConfirm: null, text: '' });

  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementSort, setAchievementSort] = useState('title');
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [scenarioSort, setScenarioSort] = useState('name');
  const [scenarioOrgFilter, setScenarioOrgFilter] = useState('all'); // all | global | orgId

  // Новое состояние для статистики
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [rolesStats, setRolesStats] = useState(null);
  const [topScenarios, setTopScenarios] = useState(null);
  const [achievementsDist, setAchievementsDist] = useState(null);
  const [topUsers, setTopUsers] = useState(null);

  const [drillDownModal, setDrillDownModal] = useState({ show: false, title: '', details: null });
  const [collapseStats, setCollapseStats] = useState(false);
  const [collapseCharts, setCollapseCharts] = useState(false);

  
  const [errorStats, setErrorStats] = useState(null);

  // --- Фильтрация достижений и сценариев (перемещено выше!) ---
  const filteredAchievements = achievements
    .filter(a =>
      a.title.toLowerCase().includes(achievementSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(achievementSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (achievementSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Если есть поле created_at, можно добавить сортировку по дате
      return 0;
    });
  const filteredScenarios = scenarios
    .filter(s =>
      s.name.toLowerCase().includes(scenarioSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(scenarioSearch.toLowerCase())
    )
    .filter(s => {
      if (scenarioOrgFilter === 'all') return true;
      if (scenarioOrgFilter === 'global') return !s.organization_id;
      return String(s.organization_id || '') === String(scenarioOrgFilter);
    })
    .sort((a, b) => {
      if (scenarioSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  // --- Пагинация достижений ---
  const [achievementPage, setAchievementPage] = useState(1);
  const achievementsPerPage = 5;
  const paginatedAchievements = filteredAchievements.slice((achievementPage-1)*achievementsPerPage, achievementPage*achievementsPerPage);
  const achievementTotalPages = Math.ceil(filteredAchievements.length / achievementsPerPage);

  // --- Пагинация сценариев ---
  const [scenarioPage, setScenarioPage] = useState(1);
  const scenariosPerPage = 5;
  const paginatedScenarios = filteredScenarios.slice((scenarioPage-1)*scenariosPerPage, scenarioPage*scenariosPerPage);
  const scenarioTotalPages = Math.ceil(filteredScenarios.length / scenariosPerPage);

  // --- Состояния для фильтра дат ---
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loadingCharts, setLoadingCharts] = useState(false);

  // --- Состояния для drill-down пользователей по роли ---
  const [drillUsers, setDrillUsers] = useState([]);
  const [loadingDrill, setLoadingDrill] = useState(false);

  // --- Состояния для drill-down списков ---
  const [drillList, setDrillList] = useState([]);
  const [loadingDrillList, setLoadingDrillList] = useState(false);

  // 1. Добавляю новое состояние для модалки подробностей по сценариям
  const [showScenarioDetailsModal, setShowScenarioDetailsModal] = useState(false);

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ОРГАНИЗАЦИЙ
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [errorOrganizations, setErrorOrganizations] = useState(null);
  const [showAddOrganizationModal, setShowAddOrganizationModal] = useState(false);
  const [organizationFormData, setOrganizationFormData] = useState({
    name: '',
    description: '',
  });
  const [showEditOrganizationModal, setShowEditOrganizationModal] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState({
    id: null,
    name: '',
    description: '',
  });
  const [showOrganizationUsersModal, setShowOrganizationUsersModal] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddUserToOrgModal, setShowAddUserToOrgModal] = useState(false);
  // Модалка сценариев организации
  const [showOrgScenariosModal, setShowOrgScenariosModal] = useState(false);
  const [currentOrgForScenarios, setCurrentOrgForScenarios] = useState(null);
  const [orgAssignedScenarios, setOrgAssignedScenarios] = useState([]);
  const [orgAvailableScenarios, setOrgAvailableScenarios] = useState([]);
  const [loadingOrgScenarios, setLoadingOrgScenarios] = useState(false);

  // Поиск и пагинация организаций
  const [organizationsSearchQuery, setOrganizationsSearchQuery] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [orgCurrentPage, setOrgCurrentPage] = useState(1);
  const orgPerPage = 10;

  useEffect(() => {
    setFilteredOrganizations(
      (organizations || []).filter(org =>
        (org.name || '').toLowerCase().includes(organizationsSearchQuery.toLowerCase()) ||
        (org.description || '').toLowerCase().includes(organizationsSearchQuery.toLowerCase())
      )
    );
    setOrgCurrentPage(1);
  }, [organizations, organizationsSearchQuery]);

  const orgTotalPages = Math.ceil((filteredOrganizations.length || 0) / orgPerPage) || 1;
  const orgIndexOfLast = orgCurrentPage * orgPerPage;
  const orgIndexOfFirst = orgIndexOfLast - orgPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(orgIndexOfFirst, orgIndexOfLast);

  // Карта: id организации -> число сценариев
  const orgIdToScenarioCount = React.useMemo(() => {
    const map = {};
    for (const sc of scenarios || []) {
      const oid = sc.organization_id || null;
      if (oid) map[oid] = (map[oid] || 0) + 1;
    }
    return map;
  }, [scenarios]);

  // Карта: id организации -> имя (для таблицы сценариев)
  const orgIdToName = React.useMemo(() => {
    const map = {};
    for (const org of organizations || []) {
      map[org.id] = org.name;
    }
    return map;
  }, [organizations]);

  // 2. Функция для загрузки иконок
  const fetchAvailableIcons = async () => {
    setLoadingIcons(true);
    try {
      const response = await authFetch('/api/upload/achievement_icons');
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

  // 3. Загружать иконки при открытии модальных окон
  useEffect(() => {
    if (showAddAchievementModal || showEditAchievementModal) {
      fetchAvailableIcons();
    }
  }, [showAddAchievementModal, showEditAchievementModal]);

  const fetchUsers = async () => {
    try {
      const response = await authFetch('/api/admin/users', { headers: { 'Content-Type': 'application/json' } });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('У вас нет прав администратора для просмотра пользователей.');
        } else {
          throw new Error('Не удалось загрузить пользователей.');
        }
      }

      const data = await response.json();
      setUsers(data);
      // Фильтруем модераторов сразу после получения всех пользователей
      setModerators(data.filter(user => user.role.toUpperCase() === 'MANAGER'));
    } catch (err) {
      setError(err.message);
      console.error('Ошибка при загрузке пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      setLoadingAchievements(true);
      const response = await authFetch('/api/achievements', { headers: { 'Content-Type': 'application/json' } });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось загрузить достижения.');
      }

      const data = await response.json();
      setAchievements(data);
    } catch (err) {
      console.error('Ошибка при загрузке достижений:', err);
      setErrorAchievements(err.message);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // НОВАЯ ФУНКЦИЯ: Загрузка сценариев
  const fetchScenarios = async () => {
    try {
      setLoadingScenarios(true);
      const response = await authFetch('/api/scenarios', { headers: { 'Content-Type': 'application/json' } });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось загрузить сценарии.');
      }

      const data = await response.json();
      setScenarios(data);
    } catch (err) {
      console.error('Ошибка при загрузке сценариев:', err);
      setErrorScenarios(err.message);
    } finally {
      setLoadingScenarios(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAchievements();
    fetchScenarios(); // Вызываем fetchScenarios при загрузке компонента
    fetchOrganizations(); // Загружаем организации
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setCurrentPage(1); // Сброс страницы при изменении поиска
  }, [users, searchQuery]);

  // НОВЫЙ useEffect для фильтрации модераторов
  useEffect(() => {
    setFilteredModerators(
      moderators.filter(mod =>
        mod.username.toLowerCase().includes(moderatorsSearchQuery.toLowerCase()) ||
        mod.email.toLowerCase().includes(moderatorsSearchQuery.toLowerCase())
      )
    );
  }, [moderators, moderatorsSearchQuery]);

  // Вычисление текущих пользователей для отображения
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Вычисление общего количества страниц
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = async (userId) => {
    setConfirmModal({
      show: true,
      text: 'Вы уверены, что хотите удалить этого пользователя?',
      onConfirm: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось удалить пользователя.');
        }
          toast.success('Пользователь успешно удален!');
          fetchUsers();
      } catch (err) {
        console.error('Ошибка при удалении пользователя:', err);
          toast.error(`Ошибка: ${err.message}`);
        } finally {
          setConfirmModal({ show: false, onConfirm: null, text: '' });
      }
    }
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/admin/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить пользователя.');
      }

      toast.success('Пользователь успешно обновлен!');
      setShowEditModal(false);
      fetchUsers(); // Обновляем список пользователей (включая модераторов)
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Обработчик изменения полей формы достижения
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

  // Обработчик изменения полей формы редактирования достижения
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

  // НОВАЯ ФУНКЦИЯ: Обработка загрузки файла иконки
  const [iconPreview, setIconPreview] = useState(null);

  const handleIconUpload = async (event, isEditForm = false) => {
    const file = event.target.files[0];
    if (!file) return;

    // Локальный preview
    const reader = new FileReader();
    reader.onload = e => setIconPreview(e.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Токен авторизации не найден.');

      const response = await fetch('/api/upload/achievement_icon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось загрузить иконку.');
      }

      const data = await response.json();
      const newIconUrl = data.url; // URL загруженной иконки с бэкенда

      setIconPreview(null); // Показываем теперь только серверный URL

      if (isEditForm) {
        setCurrentAchievement(prevData => ({
          ...prevData,
          icon: newIconUrl
        }));
      } else {
        setAchievementFormData(prevData => ({
          ...prevData,
          icon: newIconUrl
        }));
      }
      toast.success('Иконка успешно загружена!');

    } catch (err) {
      console.error('Ошибка при загрузке иконки:', err);
      toast.error(`Ошибка при загрузке иконки: ${err.message}`);
    }
  };

  // Обработчик нажатия на кнопку редактирования достижения
  const handleEditAchievementClick = (achievement) => {
    let parsedRequirements = { type: 'none', value: '' };
    if (achievement.requirements) {
      try {
        const req = typeof achievement.requirements === 'string' ? JSON.parse(achievement.requirements) : achievement.requirements;
        if (req && req.type && req.value !== undefined) {
          parsedRequirements = { type: req.type, value: String(req.value) };
        }
      } catch (e) {
        console.error("Ошибка при парсинге требований достижения:", e);
      }
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

  // Обработчик сохранения изменений достижения
  const handleSaveAchievementEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      setLoadingAchievements(true);
      const response = await fetch(`/api/achievements/${currentAchievement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentAchievement.name,
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
      fetchAchievements(); // Обновляем список достижений
    } catch (err) {
      console.error('Ошибка при обновлении достижения:', err);
      setErrorAchievements(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Обработчик отправки формы добавления достижения
  const handleAddAchievementSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

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
      fetchAchievements(); // Обновляем список достижений
    } catch (err) {
      console.error('Ошибка при добавлении достижения:', err);
      setErrorAchievements(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Обработчик удаления достижения
  const handleDeleteAchievement = async (achievementId) => {
    setConfirmModal({
      show: true,
      text: 'Вы уверены, что хотите удалить это достижение?',
      onConfirm: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Токен авторизации не найден.');
        }
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
          fetchAchievements();
      } catch (err) {
        console.error('Ошибка при удалении достижения:', err);
        setErrorAchievements(err.message);
          toast.error(`Ошибка: ${err.message}`);
      } finally {
        setLoadingAchievements(false);
          setConfirmModal({ show: false, onConfirm: null, text: '' });
      }
    }
    });
  };

  // Обработчик нажатия на кнопку "Добавить/удалить у пользователя"
  const handleAssignClick = async (achievement) => {
    setSelectedAchievementForAssignment(achievement);
    setShowAssignAchievementModal(true);
    setLoadingAchievements(true); // Индикатор загрузки для этой операции модального окна

    try {
      const usersHaving = [];
      const usersNotHaving = [];

      // Загружаем достижения для каждого пользователя, чтобы определить, у кого есть это конкретное достижение
      // Это проблема N+1 запросов, но будет работать при текущей структуре бэкенда
      for (const user of users) { // 'users' уже загружены из fetchUsers
        const response = await authFetch(`/api/users/${user.id}/achievements`, { headers: { 'Content-Type': 'application/json' } });

        if (!response.ok) {
          console.warn(`Не удалось загрузить достижения для пользователя ${user.username}:`, await response.text());
          // Считаем, что у них нет достижения, если загрузка не удалась
          usersNotHaving.push(user);
          continue;
        }

        const userAchievements = await response.json();
        const hasAchievement = userAchievements.some(ua => ua.id === achievement.id); // Исправлено на 'id'

        if (hasAchievement) {
          usersHaving.push(user);
        } else {
          usersNotHaving.push(user);
        }
      }

      setUsersWithAchievement(usersHaving);
      setAvailableUsersForAssignment(usersNotHaving);

    } catch (err) {
      console.error('Ошибка при загрузке пользователей для назначения достижений:', err);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingAchievements(false); // Завершаем загрузку
    }
  };

  // Обработчик назначения достижения пользователю
  const handleAssignAchievementToUser = async (userId, achievementId) => {
    try {
      const response = await authFetch('/api/achievements/assign_to_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          achievement_id: achievementId,
          action: 'assign',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось назначить достижение пользователю.');
      }

      toast.success('Достижение успешно назначено пользователю!');
      // Обновляем списки пользователей в модальном окне
      const assignedUser = users.find(u => u.id === userId);
      setUsersWithAchievement(prev => [...prev, assignedUser]);
      setAvailableUsersForAssignment(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Ошибка при назначении достижения пользователю:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  // Обработчик отмены назначения достижения у пользователя
  const handleUnassignAchievementFromUser = async (userId, achievementId) => {
    if (!window.confirm('Вы уверены, что хотите отменить это достижение у пользователя?')) {
      return;
    }
    try {
      const response = await authFetch(`/api/achievements/${achievementId}/unassign/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось отменить назначение достижения.');
      }

      toast.success('Назначение достижения успешно отменено!');
      // Обновляем списки пользователей в модальном окне
      const unassignedUser = users.find(u => u.id === userId);
      setAvailableUsersForAssignment(prev => [...prev, unassignedUser]);
      setUsersWithAchievement(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Ошибка при отмене назначения достижения:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  // НОВЫЙ ОБРАБОТЧИК: Отправка формы добавления сценария
  const handleAddScenarioSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

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
      // Очищаем форму
      setScenarioFormData({
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
        prompt_template_id: null,
      });
      fetchScenarios(); // Обновляем список сценариев
    } catch (err) {
      console.error('Ошибка при добавлении сценария:', err);
      setErrorScenarios(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingScenarios(false);
    }
  };

  // НОВЫЙ ОБРАБОТЧИК: Редактирование сценария
  const handleEditScenarioClick = async (scenario) => {
    setCurrentScenario({
      id: scenario.id,
      name: scenario.name, // Изменено с title на name
      description: scenario.description,
      sphere: scenario.sphere,
      situation: scenario.situation,
      mood: scenario.mood,
      language: scenario.language,
      user_role: scenario.user_role,
      ai_role: scenario.ai_role,
      ai_behavior: scenario.ai_behavior,
      is_template: scenario.is_template,
      prompt_template_id: scenario.prompt_template_id,
    });
    // Загружаем промпт-шаблоны для выбора
    await fetchPromptTemplates();
    setShowEditScenarioModal(true);
  };

  // НОВЫЙ ОБРАБОТЧИК: Сохранение изменений сценария
  const handleSaveScenarioEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      setLoadingScenarios(true);
      const response = await fetch(`/api/scenarios/${currentScenario.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentScenario), // Отправляем все данные текущего сценария
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить сценарий.');
      }

      toast.success('Сценарий успешно обновлен!');
      setShowEditScenarioModal(false);
      fetchScenarios(); // Обновляем список сценариев
    } catch (err) {
      console.error('Ошибка при обновлении сценария:', err);
      setErrorScenarios(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingScenarios(false);
    }
  };

  // НОВЫЙ ОБРАБОТЧИК: Удаление сценария (заглушка)
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
          fetchScenarios();
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

  // Новое состояние для модального окна выбора иконки
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconModalTarget, setIconModalTarget] = useState('add'); // 'add' или 'edit'
  const [iconModalTab, setIconModalTab] = useState('gallery'); // 'gallery' или 'upload'
  const [iconUrlInput, setIconUrlInput] = useState(''); // URL для загрузки иконки
  const [previewIcon, setPreviewIcon] = useState(null); // Новое состояние для предпросмотра иконки

  // Подгружаем шаблоны при открытии модалки
  useEffect(() => {
    if (showPromptTemplatesModal) {
      fetchPromptTemplates();
    }
  }, [showPromptTemplatesModal]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch('/api/admin/stats');
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
    fetchStats();
  }, []);

  // --- Функция для загрузки статистики по датам ---
  const fetchDailyStats = async () => {
    setLoadingCharts(true);
    let url = '/api/admin/stats/daily';
    if (dateFrom && dateTo) url += `?from=${dateFrom}&to=${dateTo}`;
    const response = await authFetch(url);
    if (response.ok) {
      const data = await response.json();
      setDailyStats(data);
    }
    setLoadingCharts(false);
  };

  useEffect(() => {
    fetchDailyStats();
    // eslint-disable-next-line
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const fetchRolesStats = async () => {
      const response = await authFetch('/api/admin/stats/roles');
      if (response.ok) setRolesStats(await response.json());
    };
    const fetchTopScenarios = async () => {
      const response = await authFetch('/api/admin/stats/top-scenarios');
      if (response.ok) setTopScenarios(await response.json());
    };
    const fetchAchievementsDist = async () => {
      const response = await authFetch('/api/admin/stats/achievements-distribution');
      if (response.ok) setAchievementsDist(await response.json());
    };
    const fetchTopUsers = async () => {
      const response = await authFetch('/api/admin/stats/top-users');
      if (response.ok) setTopUsers(await response.json());
    };
    fetchRolesStats();
    fetchTopScenarios();
    fetchAchievementsDist();
    fetchTopUsers();
  }, []);

  // --- useEffect для загрузки пользователей по роли при открытии drillDownModal ---
  useEffect(() => {
    if (drillDownModal.show && drillDownModal.details?.type === 'role') {
      setLoadingDrill(true);
      const token = localStorage.getItem('access_token');
      fetch(`/api/admin/users/by_role/${drillDownModal.details.label}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setDrillUsers(data.users || []))
        .catch(()=>setDrillUsers([]))
        .finally(()=>setLoadingDrill(false));
    }
  }, [drillDownModal]);

  // --- useEffect для загрузки drill-down по сценарию, достижению, пользователю ---
  useEffect(() => {
    if (drillDownModal.show && drillDownModal.details) {
      let url = '';
      if (drillDownModal.details.type === 'scenario') {
        url = `/api/admin/dialogs/by_scenario/${encodeURIComponent(drillDownModal.details.label)}`;
      } else if (drillDownModal.details.type === 'achievement') {
        url = `/api/admin/users/by_achievement/${encodeURIComponent(drillDownModal.details.label)}`;
      } else if (drillDownModal.details.type === 'user') {
        url = `/api/admin/dialogs/by_user/${encodeURIComponent(drillDownModal.details.label)}`;
      } else {
        setDrillList([]); return;
      }
      setLoadingDrillList(true);
      const token = localStorage.getItem('access_token');
      fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setDrillList(data.items || []))
        .catch(()=>setDrillList([]))
        .finally(()=>setLoadingDrillList(false));
    }
  }, [drillDownModal]);

  // ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ОРГАНИЗАЦИЯМИ ==========

  // Загрузка всех организаций
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      setLoadingOrganizations(true);
      const response = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить организации.');
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setErrorOrganizations(err.message);
      console.error('Ошибка при загрузке организаций:', err);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Создание новой организации
  const handleAddOrganizationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      setLoadingOrganizations(true);
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать организацию.');
      }

      toast.success('Организация успешно создана!');
      setShowAddOrganizationModal(false);
      // Очищаем форму
      setOrganizationFormData({
        name: '',
        description: '',
      });
      fetchOrganizations(); // Обновляем список организаций
    } catch (err) {
      console.error('Ошибка при создании организации:', err);
      setErrorOrganizations(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Редактирование организации
  const handleEditOrganizationClick = (organization) => {
    setCurrentOrganization({
      id: organization.id,
      name: organization.name,
      description: organization.description,
    });
    setShowEditOrganizationModal(true);
  };

  const handleEditOrganizationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      setLoadingOrganizations(true);
      const response = await fetch(`/api/admin/organizations/${currentOrganization.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentOrganization.name,
          description: currentOrganization.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить организацию.');
      }

      toast.success('Организация успешно обновлена!');
      setShowEditOrganizationModal(false);
      fetchOrganizations(); // Обновляем список организаций
    } catch (err) {
      console.error('Ошибка при обновлении организации:', err);
      setErrorOrganizations(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Удаление организации
  const handleDeleteOrganization = async (organizationId) => {
    setConfirmModal({
      show: true,
      text: 'Вы уверены, что хотите удалить эту организацию? Все связи (пользователи, сценарии) будут удалены.',
      onConfirm: async () => {
    try {
      const token = localStorage.getItem('access_token');
          // 1) Отвязать пользователей
          const usersRes = await fetch(`/api/admin/organizations/${organizationId}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usersData = usersRes.ok ? await usersRes.json() : [];
          for (const u of (Array.isArray(usersData) ? usersData : (usersData.users || []))) {
            await fetch(`/api/admin/organizations/${organizationId}/users/${u.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
          // 2) Отвязать сценарии (через API или fallback PUT)
          const orgScRes = await fetch(`/api/admin/organizations/${organizationId}/scenarios`, { headers: { 'Authorization': `Bearer ${token}` } });
          const assigned = orgScRes.ok ? await orgScRes.json() : [];
          for (const s of assigned) {
            const delRes = await fetch(`/api/admin/organizations/${organizationId}/scenarios/${s.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!delRes.ok) {
              // fallback PUT organization_id=null
              await fetch(`/api/scenarios/${s.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  sphere: s.sphere,
                  situation: s.situation,
                  mood: s.mood,
                  language: s.language,
                  user_role: s.user_role,
                  ai_role: s.ai_role,
                  ai_behavior: s.ai_behavior,
                  is_template: s.is_template,
                  organization_id: null,
                })
              });
            }
          }
          // 3) Удалить организацию
          const delOrgRes = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
          if (!delOrgRes.ok) {
            const errText = await delOrgRes.text();
            throw new Error(errText || 'Не удалось удалить организацию');
      }
          toast.success('Организация успешно удалена');
          fetchOrganizations();
    } catch (err) {
      toast.error(`Ошибка: ${err.message}`);
        } finally {
          setConfirmModal({ show: false, onConfirm: null, text: '' });
    }
      }
    });
  };

  // Загрузка пользователей организации
  const handleViewOrganizationUsers = async (organizationId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      const response = await fetch(`/api/admin/organizations/${organizationId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей организации.');
      }

      const data = await response.json();
      setOrganizationUsers(data);
      setCurrentOrganization({ ...currentOrganization, id: organizationId });
      setShowOrganizationUsersModal(true);
      
      // Загружаем доступных пользователей, исключая уже добавленных
      fetchAvailableUsers(organizationId);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей организации:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  // Загрузка доступных пользователей (исключая уже добавленных в организацию)
  const fetchAvailableUsers = async (organizationId = null) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей.');
      }

      const data = await response.json();
      
      if (organizationId) {
        // Получаем пользователей организации
        const orgUsersResponse = await fetch(`/api/admin/organizations/${organizationId}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (orgUsersResponse.ok) {
          const orgUsers = await orgUsersResponse.json();
          const orgUserIds = orgUsers.map(user => user.id);
          // Исключаем пользователей, которые уже в организации
          setAvailableUsers(data.filter(user => !orgUserIds.includes(user.id)));
        } else {
          // Если не удалось загрузить пользователей организации, показываем всех
          setAvailableUsers(data);
        }
      } else {
      // Фильтруем пользователей без организации
      setAvailableUsers(data.filter(user => !user.organization_id));
      }
    } catch (err) {
      console.error('Ошибка при загрузке доступных пользователей:', err);
    }
  };

  // Добавление пользователя в организацию
  const handleAddUserToOrganization = async (organizationId, userId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      const response = await fetch(`/api/admin/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось добавить пользователя в организацию.');
      }

      toast.success('Пользователь успешно добавлен в организацию!');
      setShowAddUserToOrgModal(false);
      fetchAvailableUsers(organizationId); // Обновляем список доступных пользователей
      fetchOrganizations(); // Обновляем список организаций
      handleViewOrganizationUsers(organizationId); // Обновляем список пользователей организации
    } catch (err) {
      console.error('Ошибка при добавлении пользователя в организацию:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  // Удаление пользователя из организации
  const handleRemoveUserFromOrganization = async (organizationId, userId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен авторизации не найден.');
      }

      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось удалить пользователя из организации.');
      }

      toast.success('Пользователь успешно удален из организации!');
      handleViewOrganizationUsers(organizationId); // Обновляем список пользователей организации
      fetchAvailableUsers(organizationId); // Обновляем список доступных пользователей
      fetchOrganizations(); // Обновляем список организаций
    } catch (err) {
      console.error('Ошибка при удалении пользователя из организации:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const handleOpenOrgScenarios = async (organization) => {
    setCurrentOrgForScenarios(organization);
    setShowOrgScenariosModal(true);
    setLoadingOrgScenarios(true);
    try {
      const token = localStorage.getItem('access_token');
      const [assignedRes, allRes] = await Promise.all([
        fetch(`/api/admin/organizations/${organization.id}/scenarios`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/scenarios', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const assigned = assignedRes.ok ? await assignedRes.json() : [];
      const all = allRes.ok ? await allRes.json() : [];
      const assignedIds = new Set(assigned.map(s => s.id));
      setOrgAssignedScenarios(assigned);
      setOrgAvailableScenarios(all.filter(s => !assignedIds.has(s.id)));
    } catch (e) {
      setOrgAssignedScenarios([]);
      setOrgAvailableScenarios([]);
    } finally {
      setLoadingOrgScenarios(false);
    }
  };

  const handleAssignScenarioToOrg = async (organizationId, scenarioId) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/admin/organizations/${organizationId}/scenarios`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId })
      });
      if (!res.ok) {
        // Fallback: обновим сам сценарий, установив organization_id
        const scenario = orgAvailableScenarios.find(s => s.id === scenarioId);
        if (!scenario) throw new Error('Сценарий не найден');
        const putRes = await fetch(`/api/scenarios/${scenarioId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            sphere: scenario.sphere,
            situation: scenario.situation,
            mood: scenario.mood,
            language: scenario.language,
            user_role: scenario.user_role,
            ai_role: scenario.ai_role,
            ai_behavior: scenario.ai_behavior,
            is_template: scenario.is_template,
            organization_id: organizationId,
          }),
        });
        if (!putRes.ok) throw new Error('Не удалось назначить сценарий (PUT)');
      }
      const scenario = orgAvailableScenarios.find(s => s.id === scenarioId);
      setOrgAssignedScenarios(prev => [...prev, scenario]);
      setOrgAvailableScenarios(prev => prev.filter(s => s.id !== scenarioId));
      toast.success('Сценарий назначен организации');
    } catch (e) {
      toast.error('Ошибка при назначении сценария');
    }
  };

  const handleUnassignScenarioFromOrg = async (organizationId, scenarioId) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/admin/organizations/${organizationId}/scenarios/${scenarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        // Fallback: обновим сценарий, убрав organization_id
        const scenario = orgAssignedScenarios.find(s => s.id === scenarioId);
        if (!scenario) throw new Error('Сценарий не найден');
        const putRes = await fetch(`/api/scenarios/${scenarioId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            sphere: scenario.sphere,
            situation: scenario.situation,
            mood: scenario.mood,
            language: scenario.language,
            user_role: scenario.user_role,
            ai_role: scenario.ai_role,
            ai_behavior: scenario.ai_behavior,
            is_template: scenario.is_template,
            organization_id: null,
          }),
        });
        if (!putRes.ok) throw new Error('Не удалось удалить сценарий из организации (PUT)');
      }
      const scenario = orgAssignedScenarios.find(s => s.id === scenarioId);
      setOrgAvailableScenarios(prev => [scenario, ...prev]);
      setOrgAssignedScenarios(prev => prev.filter(s => s.id !== scenarioId));
      toast.success('Сценарий удалён из организации');
    } catch (e) {
      toast.error('Ошибка при удалении сценария');
    }
  };

  // Функции для работы с промпт-шаблонами
  const fetchPromptTemplates = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/prompt-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Не удалось загрузить шаблоны');
      const data = await res.json();
      // Встроенный неизменяемый шаблон (храним текст в localStorage, чтобы не жить в коде)
      const builtinPrompt = localStorage.getItem('builtin_system_prompt') || 'Вы — базовая системная роль. Отвечайте вежливо, кратко и по делу.';
      const builtin = {
        id: '__builtin__',
        name: 'Системный (дефолтный)',
        description: 'Встроенный системный промпт по умолчанию',
        is_builtin: true,
        // для совместимости с отображением содержимого
        content_start: `Вы - Системный (дефолтный). ${builtinPrompt}`,
        content_continue: 'Продолжайте диалог, следуя установленному стилю и роли.',
        forbidden_words: 'негатив, оскорбления, неподходящий контент',
        sections_json: JSON.stringify({
          role: 'Вы - Системный (дефолтный)',
          behavior: builtinPrompt,
          guidelines: [
            'Следуйте установленной роли',
            'Будьте полезным и вежливым',
            'Избегайте запрещенных тем'
          ]
        })
      };
      setPromptTemplates([builtin, ...(Array.isArray(data) ? data : [])]);
    } catch (e) {
      setPromptTemplates([]);
      toast.error('Ошибка загрузки шаблонов');
    }
  };

  // --- СИНХРОНИЗАЦИЯ ПРИВЯЗКИ ШАБЛОНОВ К СЦЕНАРИЯМ ---
  const fetchScenarioTemplateMapServer = async () => {
    try {
      setIsSyncingTemplates(true);
      setSyncError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Нет токена авторизации');
      // Пытаемся получить карту с сервера (единый эндпоинт)
      const res = await fetch('/api/chat/prompt-templates/scenario-map', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const map = (data && data.map) || {};
        setScenarioTemplateMap(map);
        localStorage.setItem('scenarioTemplateMap', JSON.stringify(map));
      }
    } catch (e) {
      setSyncError('Не удалось синхронизировать шаблоны, используется локальное хранилище');
    } finally {
      setIsSyncingTemplates(false);
    }
  };

  const saveScenarioTemplateBinding = async (scenarioId, templateId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Нет токена авторизации');
      // Основной эндпоинт
      const res = await fetch(`/api/chat/scenarios/${scenarioId}/prompt-template`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId })
      });
      if (!res.ok) throw new Error('PUT привязки неудачен');
    } catch (e) {
      // Фолбэк: ничего, локалстораж уже обновили
    }
  };

  const clearScenarioTemplateBinding = async (scenarioId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Нет токена авторизации');
      const res = await fetch(`/api/chat/scenarios/${scenarioId}/prompt-template`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('DELETE привязки неудачен');
    } catch (e) {
      // Фолбэк: игнорируем, локально уже удалили
    }
  };

  const fetchActivePromptTemplate = async () => {
    // Активный шаблон теперь определяется контекстом сценария через локальную карту
    setActivePromptTemplateId(
      templateScenarioContext ? (scenarioTemplateMap[String(templateScenarioContext)] || null) : null
    );
  };

  const handleCreatePromptTemplate = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Автоматически генерируем структуру на основе простого промпта
      const templateData = {
        name: promptTemplateForm.name,
        description: promptTemplateForm.description,
        content_start: `Вы - ${promptTemplateForm.name}. ${promptTemplateForm.prompt}`,
        content_continue: "Продолжите диалог, следуя установленному стилю и роли.",
        forbidden_words: "негатив, оскорбления, неподходящий контент",
        sections_json: JSON.stringify({
          "role": "Вы - " + promptTemplateForm.name,
          "behavior": promptTemplateForm.prompt,
          "guidelines": [
            "Следуйте установленной роли",
            "Будьте полезным и вежливым",
            "Избегайте запрещенных тем"
          ]
        })
      };
      
      const res = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать шаблон');
      }
      toast.success('Шаблон создан');
      setPromptTemplateForm({ name: '', description: '', prompt: '' });
      fetchPromptTemplates();
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleActivatePromptTemplate = async (id) => {
    try {
      // Привязываем шаблон к сценарию в локальной карте
      if (!templateScenarioContext) {
        throw new Error('Сначала выберите сценарий (откройте управление из окна сценария)');
      }
      const scenarioIdKey = String(templateScenarioContext);
      const nextMap = { ...scenarioTemplateMap, [scenarioIdKey]: id };
      setScenarioTemplateMap(nextMap);
      localStorage.setItem('scenarioTemplateMap', JSON.stringify(nextMap));
      setActivePromptTemplateId(id);
      toast.success('Активный шаблон установлен для сценария');
      // Серверная синхронизация (не блокирующая)
      saveScenarioTemplateBinding(templateScenarioContext, id);

      // Обновляем привязку на стороне сценария (источник истины в БД)
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`/api/scenarios/${templateScenarioContext}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_template_id: id })
        });
        // Обновляем список сценариев, чтобы колонка "Промпт" обновилась сразу
        fetchScenarios();
      } catch {}
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleClearActivePromptTemplate = async () => {
    try {
      if (!templateScenarioContext) {
        throw new Error('Сначала выберите сценарий (откройте управление из окна сценария)');
      }
      const scenarioIdKey = String(templateScenarioContext);
      const nextMap = { ...scenarioTemplateMap };
      delete nextMap[scenarioIdKey];
      setScenarioTemplateMap(nextMap);
      localStorage.setItem('scenarioTemplateMap', JSON.stringify(nextMap));
      setActivePromptTemplateId(null);
      toast.success('Активный шаблон сброшен для сценария');
      clearScenarioTemplateBinding(templateScenarioContext);

      // Сбрасываем привязку в самом сценарии (prompt_template_id = null)
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`/api/scenarios/${templateScenarioContext}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_template_id: null })
        });
        // Обновляем список сценариев, чтобы колонка "Промпт" очистилась
        fetchScenarios();
      } catch {}
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleUpdatePromptTemplate = async (template) => {
    try {
      const token = localStorage.getItem('access_token');
      const errs = validateTemplate(template);
      if (errs.length) {
        toast.error(`Исправьте ошибки: ${errs.join('; ')}`);
        return;
      }
      const res = await fetch(`/api/prompt-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });
      if (!res.ok) throw new Error('Не удалось обновить шаблон');
      toast.success('Шаблон обновлён');
      fetchPromptTemplates();
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleDeletePromptTemplate = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/prompt-templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Не удалось удалить шаблон');
      toast.success('Шаблон удалён');
      fetchPromptTemplates();
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleEditTemplateContent = (template) => {
    // Собираем читаемое содержимое из полей шаблона для просмотра
    let composed = '';
    try {
      const parts = [];
      if (template.content_start) parts.push(template.content_start);
      // sections_json
      if (template.sections_json) {
        try {
          const js = typeof template.sections_json === 'string' ? JSON.parse(template.sections_json) : template.sections_json;
          if (js && js.role) parts.push(`Роль: ${js.role}`);
          if (js && js.behavior) parts.push(`Поведение: ${js.behavior}`);
          if (Array.isArray(js?.guidelines) && js.guidelines.length) {
            parts.push(`Рекомендации:\n- ${js.guidelines.join('\n- ')}`);
          }
        } catch {}
      }
      if (template.forbidden_words) parts.push(`Избегай: ${template.forbidden_words}`);
      if (template.content_continue) parts.push(template.content_continue);
      composed = parts.filter(Boolean).join('\n\n');
    } catch {
      composed = '';
    }
    setEditingTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      prompt: composed,
    });
    setEditingTemplateReadOnly(!!template.is_builtin || template.id === '__builtin__');
    setShowEditTemplateModal(true);
  };

  const handleSaveTemplateContent = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      // Генерируем структуру так же, как при создании
      const payload = {
        id: editingTemplate.id,
        name: editingTemplate.name,
        description: editingTemplate.description,
        content_start: `Вы - ${editingTemplate.name}. ${editingTemplate.prompt}`,
        content_continue: 'Продолжите диалог, следуя установленному стилю и роли.',
        forbidden_words: 'негатив, оскорбления, неподходящий контент',
        sections_json: JSON.stringify({
          role: 'Вы - ' + editingTemplate.name,
          behavior: editingTemplate.prompt,
          guidelines: [
            'Следуйте установленной роли',
            'Будьте полезным и вежливым',
            'Избегайте запрещенных тем'
          ]
        })
      };
      const res = await fetch(`/api/prompt-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Не удалось обновить шаблон');
      toast.success('Содержимое шаблона обновлено');
      setShowEditTemplateModal(false);
      fetchPromptTemplates();
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  // Загрузка шаблонов при монтировании компонента и при смене контекста сценария
  useEffect(() => {
    fetchPromptTemplates();
    fetchScenarioTemplateMapServer();
  }, []);
  useEffect(() => {
    fetchActivePromptTemplate();
  }, [templateScenarioContext, scenarioTemplateMap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F8FF] dark:bg-gray-900 py-12 flex items-center justify-center transition-colors">
        <div className="text-gray-600 dark:text-gray-200 text-lg">Загрузка панели...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F1F8FF] dark:bg-gray-900 py-12 flex items-center justify-center transition-colors">
        <div className="text-red-600 dark:text-red-400 text-lg">Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-12 flex flex-col items-center transition-all">
      {/* Хлебные крошки */}
      <nav className="w-full max-w-[1200px] mb-2 sm:mb-4 text-xs sm:text-sm">
        <ol className="flex flex-wrap items-center space-x-1 sm:space-x-2 text-gray-400 dark:text-gray-400 break-words">
          <li>
            <Link to="/" className="hover:underline text-blue-400 dark:text-blue-300">Главная</Link>
          </li>
          <li>/</li>
          <li className="text-gray-200 font-semibold">Админ-панель</li>
        </ol>
      </nav>
      {/* Крупный заголовок */}
      <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-[48px] font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 text-center font-['Inter'] drop-shadow-lg transition-colors break-words leading-tight">Админ-панель</h1>
      <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 sm:mb-10 text-center break-words">Управление сайтом</p>
      {/* Основные карточки */}
      <div className="w-full max-w-full md:max-w-[900px] flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-12 px-1 sm:px-2 md:px-0">
        {/* Карточка пользователей */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-2 sm:mb-4 w-full max-w-full md:max-w-[900px] transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
            <UserGroupIcon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 dark:text-blue-200">Пользователи</span>
          </div>
          {/* Фильтр */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-2 sm:mb-3 gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-light">Фильтр</span>
            <input
              type="text"
              placeholder="Поиск по имени или email"
              className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-2 py-2 focus:outline-none focus:border-[#0D47A1] dark:focus:border-blue-400 w-full sm:w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors text-xs sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Таблица */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-[500px] sm:min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs sm:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Имя</th>
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Роль</th>
                  <th className="px-2 py-2 font-semibold hidden sm:table-cell">Последняя активность</th>
                  <th className="px-2 py-2 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, idx) => (
                  <tr key={user.id} className={`border-t border-gray-100 dark:border-gray-700 transition ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-800/80'} hover:bg-[#F1F8FF] dark:hover:bg-gray-700`}>
                    <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{user.username}</td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{user.role}</td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Неизвестно'}</td>
                    <td className="px-2 py-2">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="bg-[#0D47A1] dark:bg-blue-700 text-white rounded-[8px] px-2 py-1 mr-1 hover:bg-[#1565c0] dark:hover:bg-blue-800 transition-all shadow focus:ring-2 focus:ring-blue-400 text-xs"
                      >
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user.id)}
                        className="bg-red-500 dark:bg-red-700 text-white rounded-[8px] px-2 py-1 hover:bg-red-700 dark:hover:bg-red-800 transition-all shadow focus:ring-2 focus:ring-red-400 text-xs"
                      >
                        <TrashIcon className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Пагинация */}
          <div className="flex justify-end gap-2 mt-auto">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-[#0D47A1] dark:bg-blue-700 text-white rounded-[8px] px-4 py-1 hover:bg-[#1565c0] dark:hover:bg-blue-800 transition-all shadow focus:ring-2 focus:ring-blue-400"
            >
              Назад
            </button>
            <span className="text-base text-gray-700 dark:text-gray-300 font-light">
              Страница {currentPage} из {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-[#0D47A1] dark:bg-blue-700 text-white rounded-[8px] px-4 py-1 hover:bg-[#1565c0] dark:hover:bg-blue-800 transition-all shadow focus:ring-2 focus:ring-blue-400"
            >
              Вперед
            </button>
          </div>
        </div>
        {/* Карточка модераторов */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-2 sm:mb-4 w-full max-w-full md:max-w-[900px] transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
            <UserGroupIcon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 dark:text-blue-200">Модераторы</span>
          </div>
          {/* Фильтр */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-2 sm:mb-3 gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-light">Фильтр</span>
            <input
              type="text"
              placeholder="Поиск по имени или email"
              className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-2 py-2 focus:outline-none focus:border-[#0D47A1] dark:focus:border-blue-400 w-full sm:w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors text-xs sm:text-base"
              value={moderatorsSearchQuery}
              onChange={(e) => setModeratorsSearchQuery(e.target.value)}
            />
          </div>
          {/* Таблица */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-[500px] sm:min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs sm:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Имя</th>
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Роль</th>
                  <th className="px-2 py-2 font-semibold hidden sm:table-cell">Последняя активность</th>
                  <th className="px-2 py-2 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredModerators.length === 0 ? (
                  <tr><td colSpan="5" className="px-2 py-2 text-center text-gray-600">Нет доступных модераторов.</td></tr>
                ) : (
                  filteredModerators.map((moderator) => (
                    <tr key={moderator.id} className="border-t border-gray-100 hover:bg-[#F1F8FF] transition">
                      <td className="px-2 py-2 text-gray-900">{moderator.username}</td>
                      <td className="px-2 py-2 text-gray-700">{moderator.email}</td>
                      <td className="px-2 py-2 text-gray-700 hidden xs:table-cell">{moderator.role}</td>
                      <td className="px-2 py-2 text-gray-700 hidden sm:table-cell">{moderator.last_login ? new Date(moderator.last_login).toLocaleDateString() : 'Неизвестно'}</td>
                      <td className="px-2 py-2">
                        <button 
                          onClick={() => handleEditClick(moderator)}
                          className="bg-[#0D47A1] text-white rounded-[8px] px-2 py-1 mr-1 hover:bg-[#1565c0] transition text-xs"
                        >
                          <PencilIcon className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(moderator.id)}
                          className="bg-red-500 text-white rounded-[8px] px-2 py-1 hover:bg-red-700 transition text-xs"
                        >
                          <TrashIcon className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Карточка организаций */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-2 sm:mb-4 w-full max-w-full md:max-w-[900px] transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
            <UserGroupIcon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 dark:text-blue-200">Организации</span>
          </div>

          {/* Фильтр и добавление */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-2 sm:mb-3 gap-1 sm:gap-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-light">Фильтр</span>
              <input
                type="text"
                placeholder="Поиск по названию или описанию"
                className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-2 py-2 focus:outline-none focus:border-[#0D47A1] dark:focus:border-blue-400 w-full sm:w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors text-xs sm:text-base"
                value={organizationsSearchQuery}
                onChange={(e) => setOrganizationsSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddOrganizationModal(true)}
              className="bg-green-500 text-white rounded-[8px] px-3 py-1 hover:bg-green-700 transition min-w-[140px] text-xs sm:text-base"
            >
              Добавить организацию
            </button>
          </div>

          {/* Таблица организаций */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-[500px] sm:min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs sm:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Название</th>
                  <th className="px-2 py-2 font-semibold">Описание</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Пользователей</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Сценариев</th>
                  <th className="px-2 py-2 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrganizations ? (
                  <tr><td colSpan="5" className="px-4 py-2 text-center">Загрузка организаций...</td></tr>
                ) : errorOrganizations ? (
                  <tr><td colSpan="5" className="px-4 py-2 text-center text-red-600">Ошибка: {errorOrganizations}</td></tr>
                ) : filteredOrganizations.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-2 text-center text-gray-400 dark:text-gray-500">Нет доступных организаций.</td></tr>
                ) : (
                  paginatedOrganizations.map((organization, idx) => (
                    <tr
                      key={organization.id}
                      className={`border-t border-gray-100 dark:border-gray-700 transition ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900/80' : 'bg-gray-50 dark:bg-gray-900/60'} hover:bg-[#F1F8FF] dark:hover:bg-gray-800/70`}
                    >
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{organization.name}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{organization.description}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{organization.user_count || 0}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{orgIdToScenarioCount[organization.id] || 0}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 items-center">
                          <button 
                            onClick={() => handleViewOrganizationUsers(organization.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                          >
                            <UserGroupIcon className="w-4 h-4 mr-1" />
                            Пользователи
                          </button>
                          <button 
                            onClick={() => handleOpenOrgScenarios(organization)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                          >
                            <ChartBarIcon className="w-4 h-4 mr-1" />
                            Сценарии
                          </button>
                          <button 
                            onClick={() => handleEditOrganizationClick(organization)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-[8px] px-3 py-1 transition flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Редактировать
                          </button>
                          <button 
                            onClick={() => handleDeleteOrganization(organization.id)}
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
          {/* Пагинация организаций */}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setOrgCurrentPage(p => Math.max(1, p-1))} disabled={orgCurrentPage===1} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Назад</button>
            {[...Array(orgTotalPages)].map((_,i) => (
              <button key={i} onClick={()=>setOrgCurrentPage(i+1)} className={`px-3 py-1 rounded ${orgCurrentPage===i+1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>{i+1}</button>
            ))}
            <button onClick={() => setOrgCurrentPage(p => Math.min(orgTotalPages, p+1))} disabled={orgCurrentPage===orgTotalPages} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50">Вперёд</button>
          </div>
        </div>
        {/* Карточка организаций */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-2 sm:mb-4 w-full max-w-full md:max-w-[900px] transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
            <ChartBarIcon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 dark:text-blue-200">Достижения</span>
          </div>
          {/* Поиск и сортировка */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-2 sm:mb-4 w-full">
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              className="border border-gray-400 dark:border-gray-700 rounded-[8px] px-2 py-2 text-xs sm:text-base focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 w-full sm:w-48 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors"
              value={achievementSearch}
              onChange={e => setAchievementSearch(e.target.value)}
            />
            <button
              className={`px-3 py-1 rounded-lg font-semibold transition text-xs sm:text-base ${achievementSort === 'title' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'} hover:bg-blue-600 dark:hover:bg-blue-600`}
              onClick={() => setAchievementSort('title')}
              style={{ minWidth: '100px' }}
            >
              Сортировать по названию
            </button>
            <button 
              onClick={() => setShowAddAchievementModal(true)}
              className="bg-green-500 text-white rounded-[8px] px-3 py-1 hover:bg-green-700 transition min-w-[100px] text-xs sm:text-base"
            >
              Добавить новое достижение
            </button>
          </div>
          {/* Таблица достижений */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-[500px] sm:min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs sm:text-sm transition-colors">
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
                          onClick={() => handleAssignClick(achievement)}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-2 sm:mb-4 w-full max-w-full md:max-w-[900px] transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-4 gap-1 sm:gap-0">
            <ChartBarIcon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-800 dark:text-blue-300 mr-0 sm:mr-4" />
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 dark:text-blue-200">Сценарии</span>
          </div>
          {/* Поиск и сортировка */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-2 sm:mb-4 w-full">
            <input
              type="text"
              placeholder="Поиск по названию или описанию"
              className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-2 py-2 text-xs sm:text-base focus:outline-none focus:border-[#0D47A1] dark:focus:border-blue-400 w-full sm:w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors"
              value={scenarioSearch}
              onChange={e => setScenarioSearch(e.target.value)}
            />
            <select
              className="border border-gray-300 dark:border-gray-700 rounded-[8px] px-2 py-2 text-xs sm:text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              value={scenarioOrgFilter}
              onChange={e => setScenarioOrgFilter(e.target.value)}
            >
              <option value="all">Все организации</option>
              <option value="global">Общие (без организации)</option>
              {organizations.map(org => (
                <option key={org.id} value={String(org.id)}>{org.name}</option>
              ))}
            </select>
            <button
              className={`px-3 py-1 rounded-lg font-semibold transition text-xs sm:text-base ${scenarioSort === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-700`}
              onClick={() => setScenarioSort('name')}
              style={{ minWidth: '100px' }}
            >
              Сортировать по названию
            </button>
            <button 
              onClick={async () => {
                await fetchPromptTemplates();
                setShowAddScenarioModal(true);
              }}
              className="bg-green-500 text-white rounded-[8px] px-3 py-1 hover:bg-green-700 transition min-w-[100px] text-xs sm:text-base"
            >
              Добавить новый сценарий
            </button>
          </div>
          {/* Таблица сценариев */}
          <div className="overflow-x-auto rounded-[10px] border border-gray-100 dark:border-gray-700 mb-2">
            <table className="min-w-[500px] sm:min-w-full bg-white dark:bg-gray-800 rounded-[10px] text-xs sm:text-sm transition-colors">
              <thead>
                <tr className="bg-[#F1F8FF] dark:bg-gray-700 text-[#0D47A1] dark:text-blue-200 text-left">
                  <th className="px-2 py-2 font-semibold">Название</th>
                  <th className="px-2 py-2 font-semibold">Описание</th>
                  <th className="px-2 py-2 font-semibold hidden xs:table-cell">Сфера</th>
                  <th className="px-2 py-2 font-semibold hidden sm:table-cell">Ситуация</th>
                  <th className="px-2 py-2 font-semibold hidden md:table-cell">Организация</th>
                  <th className="px-2 py-2 font-semibold hidden md:table-cell">Промпт</th>
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
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>{scenario.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${scenario.organization_id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                          {scenario.organization_id ? (orgIdToName[scenario.organization_id] || 'Орг.') : 'Общий'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{scenario.description}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden xs:table-cell">{scenario.sphere}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{scenario.situation}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden md:table-cell">{scenario.organization_id ? (orgIdToName[scenario.organization_id] || '-') : '—'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {scenario.prompt_template && scenario.prompt_template.name ? scenario.prompt_template.name : '—'}
                      </td>
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

      {/* БЛОК СТАТИСТИКИ */}
      <div id="admin-stats" className="w-full max-w-[900px] mt-4 md:mt-6 px-2 sm:px-4 md:px-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100 transition-colors">Статистика</h2>
        {/* Кнопки для сворачивания на мобильных */}
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
          {/* Line: динамика пользователей и диалогов */}
          {dailyStats && Array.isArray(dailyStats.dates) && Array.isArray(dailyStats.users_per_day) && Array.isArray(dailyStats.dialogs_per_day) && dailyStats.dates.length > 0 ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Динамика пользователей и диалогов (30 дней)</h2>
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                <b>Как пользоваться:</b> Выберите период дат и нажмите "Показать". График отобразит новых пользователей и завершённые диалоги по дням.
              </div>
              <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
                <label className="text-gray-700 dark:text-gray-300">Период:</label>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100" />
                <span className="text-gray-500 dark:text-gray-400">—</span>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100" />
                <button onClick={fetchDailyStats} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 transition">Показать</button>
              </div>
              {loadingCharts && <div className="text-center text-blue-500 py-4 animate-pulse">Загрузка данных...</div>}
              <div className="w-full overflow-x-auto"><div className="min-w-[400px] min-h-[220px] sm:min-h-[320px]">
                <Line
                  data={{
                    labels: dailyStats.dates,
                    datasets: [
                      {
                        label: 'Новые пользователи',
                        data: dailyStats.users_per_day,
                        borderColor: getChartColors().bg1,
                        backgroundColor: getChartColors().bg1,
                        tension: 0.3,
                      },
                      {
                        label: 'Завершённые диалоги',
                        data: dailyStats.dialogs_per_day,
                        borderColor: getChartColors().bg2,
                        backgroundColor: getChartColors().bg2,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    animation: { duration: 1200, easing: 'easeInOutQuart' },
                    plugins: {
                      legend: { position: 'top', labels: { color: getChartColors().text } },
                      title: { display: false },
                    },
                    scales: {
                      x: { title: { display: true, text: 'Дата', color: getChartColors().text }, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                      y: { title: { display: true, text: 'Количество', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                    },
                  }}
                />
              </div></div>
            </div>
          ) : dailyStats && ( // если dailyStats есть, но данные некорректны
            <div className="text-center text-red-500 py-8 animate-fade-in">
              Ошибка: данные для графика некорректны или пусты.<br/>
              Проверьте, что выбран правильный период и на сервере есть данные.<br/>
              <pre className="text-xs text-gray-400 mt-2">{JSON.stringify(dailyStats, null, 2)}</pre>
            </div>
          )}
          {/* Pie: распределение ролей пользователей */}
          {rolesStats ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 flex flex-col items-center overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Распределение ролей пользователей</h2>
              <div className="w-full max-w-xs">
                <Pie
                  data={{
                    labels: Object.keys(rolesStats),
                    datasets: [{
                      data: Object.values(rolesStats),
                      backgroundColor: [getChartColors().bg1, getChartColors().bg2, getChartColors().bg3, getChartColors().bg4, getChartColors().bg5],
                    }],
                  }}
                  options={{
                    plugins: { legend: { position: 'bottom', labels: { color: getChartColors().text } } },
                    animation: { duration: 1200, easing: 'easeInOutQuart' },
                    onClick: (evt, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = Object.keys(rolesStats)[index];
                        setDrillDownModal({ show: true, title: `Роль: ${label}`, details: { type: 'role', label } });
                      }
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных по ролям пользователей</div>
          )}
          {/* Bar: топ-5 популярных сценариев */}
          {topScenarios ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-8 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="w-full md:w-2/3 flex-shrink-0">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center md:text-left">График сценариев</h2>
                <div className="w-full overflow-x-auto"><div className="min-w-[400px] min-h-[220px] sm:min-h-[320px]">
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
                        x: { title: { display: false }, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                        y: { title: { display: true, text: 'Диалогов', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                      },
                    }}
                  />
                </div></div>
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
                  onClick={() => setShowScenarioDetailsModal(true)}
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
              <div className="w-full overflow-x-auto"><div className="min-w-[400px] min-h-[220px] sm:min-h-[320px]">
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
                      x: { title: { display: true, text: 'Пользователей', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                      y: { title: { display: true, text: 'Достижение', color: getChartColors().text }, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                    },
                    onClick: (evt, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = achievementsDist.labels[index];
                        setDrillDownModal({ show: true, title: `Достижение: ${label}`, details: { type: 'achievement', label } });
                      }
                    },
                  }}
                />
              </div></div>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных по достижениям</div>
          )}
          {/* Bar: топ-10 самых активных пользователей */}
          {topUsers ? (
            <div className="rounded-2xl shadow-xl p-6 mb-6 overflow-x-auto transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Топ-10 самых активных пользователей</h2>
              <div className="w-full overflow-x-auto"><div className="min-w-[400px] min-h-[220px] sm:min-h-[320px]">
                <Bar
                  data={{
                    labels: topUsers.labels,
                    datasets: [{
                      label: 'Диалогов',
                      data: topUsers.counts,
                      backgroundColor: [getChartColors().bg3, getChartColors().bg4, getChartColors().bg5, getChartColors().bg6, getChartColors().bg1, getChartColors().bg2],
                    }],
                  }}
                  options={{
                    responsive: true,
                    animation: { duration: 1200, easing: 'easeInOutQuart' },
                    plugins: { legend: { display: false, labels: { color: getChartColors().text } } },
                    indexAxis: 'y',
                    scales: {
                      x: { title: { display: true, text: 'Диалогов', color: getChartColors().text }, beginAtZero: true, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                      y: { title: { display: true, text: 'Пользователь', color: getChartColors().text }, ticks: { color: getChartColors().text }, grid: { color: getChartColors().grid } },
                    },
                    onClick: (evt, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = topUsers.labels[index];
                        setDrillDownModal({ show: true, title: `Пользователь: ${label}`, details: { type: 'user', label } });
                      }
                    },
                  }}
                />
              </div></div>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8 animate-fade-in">Нет данных по активности пользователей</div>
          )}
        </>}
        {/* Drill-down модалка */}
        {drillDownModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-2 relative animate-fade-in">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setDrillDownModal({ show: false, title: '', details: null })}>
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{drillDownModal.title}</h3>
              <div className="text-gray-800 dark:text-gray-200">
                {drillDownModal.details?.type === 'role' ? (
                  <div>
                    <p className="mb-2">Пользователи с ролью <span className="font-semibold">{drillDownModal.details.label}</span>:</p>
                    {loadingDrill ? (
                      <div className="text-blue-500 animate-pulse">Загрузка...</div>
                    ) : drillUsers.length === 0 ? (
                      <div className="text-gray-400">Нет пользователей с этой ролью.</div>
                    ) : (
                      <ul className="list-disc pl-5 max-h-60 overflow-y-auto">
                        {drillUsers.map(u => <li key={u.id}>{u.email} ({u.username})</li>)}
                      </ul>
                    )}
                  </div>
                ) : drillDownModal.details?.type === 'scenario' ? (
                  <div>
                    <p className="mb-2">Диалоги по сценарию <span className="font-semibold">{drillDownModal.details.label}</span>:</p>
                    {loadingDrillList ? (
                      <div className="text-blue-500 animate-pulse">Загрузка...</div>
                    ) : drillList.length === 0 ? (
                      <div className="text-gray-400">Нет диалогов по этому сценарию.</div>
                    ) : (
                      <ul className="list-decimal pl-5 max-h-60 overflow-y-auto">
                        {drillList.map(d => <li key={d.id}>Диалог #{d.id} — {d.date}</li>)}
                      </ul>
                    )}
                  </div>
                ) : drillDownModal.details?.type === 'achievement' ? (
                  <div>
                    <p className="mb-2">Пользователи с достижением <span className="font-semibold">{drillDownModal.details.label}</span>:</p>
                    {loadingDrillList ? (
                      <div className="text-blue-500 animate-pulse">Загрузка...</div>
                    ) : drillList.length === 0 ? (
                      <div className="text-gray-400">Нет пользователей с этим достижением.</div>
                    ) : (
                      <ul className="list-disc pl-5 max-h-60 overflow-y-auto">
                        {drillList.map(u => <li key={u.id}>{u.email} ({u.username})</li>)}
                      </ul>
                    )}
                  </div>
                ) : drillDownModal.details?.type === 'user' ? (
                  <div>
                    <p className="mb-2">Диалоги пользователя <span className="font-semibold">{drillDownModal.details.label}</span>:</p>
                    {loadingDrillList ? (
                      <div className="text-blue-500 animate-pulse">Загрузка...</div>
                    ) : drillList.length === 0 ? (
                      <div className="text-gray-400">Нет диалогов у этого пользователя.</div>
                    ) : (
                      <ul className="list-decimal pl-5 max-h-60 overflow-y-auto">
                        {drillList.map(d => <li key={d.id}>Диалог #{d.id} — {d.date}</li>)}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p>Здесь будет подробная информация по: <span className="font-semibold">{drillDownModal.details?.label}</span></p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования пользователя */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-3 sm:p-4 w-full max-w-[95vw] sm:max-w-sm mx-2 relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 sm:p-2" onClick={() => setShowEditModal(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">Редактировать пользователя</h3>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-2">
              <input type="text" name="username" value={editFormData.username} onChange={handleInputChange} className="border rounded px-2 py-1 text-xs sm:text-sm dark:bg-gray-800 dark:text-gray-100" placeholder="Имя пользователя" />
              <input type="email" name="email" value={editFormData.email} onChange={handleInputChange} className="border rounded px-2 py-1 text-xs sm:text-sm dark:bg-gray-800 dark:text-gray-100" placeholder="Email" />
              <select name="role" value={editFormData.role} onChange={handleInputChange} className="border rounded px-2 py-1 text-xs sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                <option value="USER">Пользователь</option>
                <option value="MANAGER">Модератор</option>
                <option value="ADMIN">Админ</option>
              </select>
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <input type="checkbox" name="is_active" checked={editFormData.is_active} onChange={handleInputChange} /> Активен
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white rounded py-2 w-full sm:w-auto hover:bg-blue-700 transition">Сохранить</button>
                <button type="button" className="bg-gray-300 text-gray-800 rounded py-2 w-full sm:w-auto hover:bg-gray-400 transition" onClick={() => setShowEditModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно добавления нового достижения */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors relative animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Добавить новое достижение</h2>
              <button onClick={() => setShowAddAchievementModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAchievementSubmit}>
              <div className="mb-4">
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
              <div className="mb-4">
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
                  {iconPreview ? (
                    <img src={iconPreview} alt="preview" className="w-12 h-12 rounded" />
                  ) : achievementFormData.icon && (
                    <img src={achievementFormData.icon.startsWith('http') ? achievementFormData.icon : achievementFormData.icon.startsWith('/api/achievement_icon/') ? achievementFormData.icon : `${BACKEND_URL}/api/achievement_icon/${achievementFormData.icon}`} alt="icon preview" className="w-12 h-12 rounded" />
                  )}
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAchievementModal(false);
                    setAchievementFormData({ title: '', description: '', icon: '', points: 0, is_repeatable: false, requirements: { type: 'none', value: '' } });
                  }}
                  className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 px-4 rounded mr-2 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования достижения */}
      {showEditAchievementModal && currentAchievement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Редактировать достижение: {currentAchievement.title}</h2>
              <button onClick={() => setShowEditAchievementModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAchievementEdit}>
              <div className="mb-4">
                <label htmlFor="edit-achievement-title" className="block text-gray-700 text-sm font-bold mb-2">Название:</label>
                <input
                  type="text"
                  id="edit-achievement-title"
                  name="title"
                  value={currentAchievement.title}
                  onChange={handleEditAchievementChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-achievement-description" className="block text-gray-700 text-sm font-bold mb-2">Описание:</label>
                <textarea
                  id="edit-achievement-description"
                  name="description"
                  value={currentAchievement.description}
                  onChange={handleEditAchievementChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Иконка:</label>
                <div className="flex gap-2 items-center">
                  {iconPreview ? (
                    <img src={iconPreview} alt="preview" className="w-12 h-12 rounded" />
                  ) : currentAchievement.icon && (
                    <img src={currentAchievement.icon.startsWith('http') ? currentAchievement.icon : currentAchievement.icon.startsWith('/api/achievement_icon/') ? currentAchievement.icon : `${BACKEND_URL}/api/achievement_icon/${currentAchievement.icon}`} alt="icon preview" className="w-12 h-12 rounded" />
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.svg"
                    onChange={e => handleIconUpload(e, true)}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-achievement-points" className="block text-gray-700 text-sm font-bold mb-2">Баллы:</label>
                <input
                  type="number"
                  id="edit-achievement-points"
                  name="points"
                  value={currentAchievement.points}
                  onChange={handleEditAchievementChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="edit-achievement-is-repeatable"
                  name="is_repeatable"
                  checked={currentAchievement.is_repeatable}
                  onChange={handleEditAchievementChange}
                  className="mr-2 leading-tight"
                />
                <label htmlFor="edit-achievement-is-repeatable" className="text-gray-700 text-sm font-bold">Повторяемое</label>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-achievement-requirements-type" className="block text-gray-700 text-sm font-bold mb-2">Тип требования:</label>
                <select
                  id="edit-achievement-requirements-type"
                  name="requirementType"
                  value={currentAchievement.requirements.type}
                  onChange={handleEditAchievementChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline mb-2"
                >
                  <option value="none">Нет</option>
                  <option value="total_dialogs">Завершить диалогов</option>
                  <option value="time">Время (секунд)</option>
                </select>
                {currentAchievement.requirements.type === 'time' ? (
                  <div>
                    <label htmlFor="edit-achievement-requirements-value" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Время (секунд):</label>
                    <input
                      type="number"
                      id="edit-achievement-requirements-value"
                      name="requirementValue"
                      value={currentAchievement.requirements.value}
                      onChange={handleEditAchievementChange}
                      className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                      placeholder="Введите время в секундах"
                    />
                  </div>
                ) : currentAchievement.requirements.type !== 'none' ? (
                  <div>
                    <label htmlFor="edit-achievement-requirements-value" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Значение:</label>
                    <input
                      type="number"
                      id="edit-achievement-requirements-value"
                      name="requirementValue"
                      value={currentAchievement.requirements.value}
                      onChange={handleEditAchievementChange}
                      className="shadow appearance-none border border-gray-300 dark:border-gray-700 rounded w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:shadow-outline transition-colors"
                      placeholder="Введите числовое значение"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditAchievementModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно назначения/отмены назначения достижения пользователю */}
      {showAssignAchievementModal && selectedAchievementForAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Назначить/Отменить достижение: {selectedAchievementForAssignment.title}</h2>
              <button onClick={() => setShowAssignAchievementModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Уже имеют достижение:</h3>
                {usersWithAchievement.length === 0 ? (
                  <p className="text-gray-600">Никто не имеет это достижение.</p>
                ) : (
                  <ul className="border rounded p-2 max-h-60 overflow-y-auto">
                    {usersWithAchievement.map(user => (
                      <li key={user.id} className="flex justify-between items-center py-1">
                        <span>{user.username} ({user.email})</span>
                        <button 
                          onClick={() => handleUnassignAchievementFromUser(user.id, selectedAchievementForAssignment.id)}
                          className="bg-red-500 text-white rounded-md px-2 py-1 text-sm hover:bg-red-700 transition"
                        >
                          Отменить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Доступные пользователи:</h3>
                {availableUsersForAssignment.length === 0 ? (
                  <p className="text-gray-600">Все пользователи имеют это достижение или нет доступных пользователей.</p>
                ) : (
                  <ul className="border rounded p-2 max-h-60 overflow-y-auto">
                    {availableUsersForAssignment.map(user => (
                      <li key={user.id} className="flex justify-between items-center py-1">
                        <span>{user.username} ({user.email})</span>
                        <button 
                          onClick={() => handleAssignAchievementToUser(user.id, selectedAchievementForAssignment.id)}
                          className="bg-green-500 text-white rounded-md px-2 py-1 text-sm hover:bg-green-700 transition"
                        >
                          Назначить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowAssignAchievementModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления нового сценария */}
      {showAddScenarioModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors relative animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Добавить новый сценарий</h2>
              <button onClick={() => setShowAddScenarioModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            <form onSubmit={handleAddScenarioSubmit} className="space-y-6">
              <div>
                <label htmlFor="scenario-title" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Название:</label>
                <input
                  type="text"
                  id="scenario-title"
                  name="title"
                  value={scenarioFormData.name}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Введите название сценария"
                />
              </div>
              <div>
                <label htmlFor="scenario-description" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Описание:</label>
                <textarea
                  id="scenario-description"
                  name="description"
                  value={scenarioFormData.description}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, description: e.target.value })}
                  className="w-full min-h-[60px] h-24 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm resize-none"
                  required
                  placeholder="Введите описание сценария"
                ></textarea>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700/40 pb-4 mb-2"></div>
              <div>
                <label htmlFor="scenario-sphere" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Сфера:</label>
                <input
                  type="text"
                  id="scenario-sphere"
                  name="sphere"
                  value={scenarioFormData.sphere}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, sphere: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: Работа, Учёба, Личная жизнь"
                />
              </div>
              <div>
                <label htmlFor="scenario-situation" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Ситуация:</label>
                <input
                  type="text"
                  id="scenario-situation"
                  name="situation"
                  value={scenarioFormData.situation}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, situation: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: Собеседование, Переговоры"
                />
              </div>
              <div>
                <label htmlFor="scenario-mood" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Настроение:</label>
                <input
                  type="text"
                  id="scenario-mood"
                  name="mood"
                  value={scenarioFormData.mood}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, mood: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: Нейтральное, Позитивное, Агрессивное"
                />
              </div>
              <div>
                <label htmlFor="scenario-language" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Язык:</label>
                <input
                  type="text"
                  id="scenario-language"
                  name="language"
                  value={scenarioFormData.language}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, language: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: Русский, Английский"
                />
              </div>
              <div>
                <label htmlFor="scenario-user-role" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Роль пользователя:</label>
                <input
                  type="text"
                  id="scenario-user-role"
                  name="user_role"
                  value={scenarioFormData.user_role}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, user_role: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: клиент, сотрудник"
                />
              </div>
              <div>
                <label htmlFor="scenario-ai-role" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Роль AI:</label>
                <input
                  type="text"
                  id="scenario-ai-role"
                  name="ai_role"
                  value={scenarioFormData.ai_role}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, ai_role: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Например: администратор отеля, менеджер"
                />
              </div>
              <div>
                <label htmlFor="scenario-ai-behavior" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Поведение AI:</label>
                <textarea
                  id="scenario-ai-behavior"
                  name="ai_behavior"
                  value={scenarioFormData.ai_behavior}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, ai_behavior: e.target.value })}
                  className="w-full min-h-[48px] h-20 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm resize-none"
                  required
                  placeholder="Например: недовольный клиент, спокойный сотрудник"
                ></textarea>
              </div>
              <div>
                <label htmlFor="scenario-prompt-template" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Промпт-шаблон:</label>
                <select
                  id="scenario-prompt-template"
                  name="prompt_template_id"
                  value={scenarioFormData.prompt_template_id || ''}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, prompt_template_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                >
                  <option value="">Выберите промпт-шаблон (необязательно)</option>
                  {promptTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setTemplateScenarioContext(null); setShowPromptTemplatesModal(true); }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Управление шаблонами системных промптов
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="scenario-is-template"
                  name="is_template"
                  checked={scenarioFormData.is_template}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, is_template: e.target.checked })}
                  className="mr-2 leading-tight accent-blue-600 dark:accent-blue-400"
                />
                <label htmlFor="scenario-is-template" className="text-gray-700 dark:text-gray-300 text-base">Является шаблоном (не будет отображаться для пользователей)</label>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddScenarioModal(false)}
                  className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 px-6 rounded-xl transition-colors shadow"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования сценария */}
      {showEditScenarioModal && currentScenario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Редактировать сценарий: {currentScenario.name}</h2>
              <button onClick={() => setShowEditScenarioModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveScenarioEdit}>
              <div className="mb-4">
                <label htmlFor="edit-scenario-title" className="block text-gray-700 text-sm font-bold mb-2">Название:</label>
                <input
                  type="text"
                  id="edit-scenario-title"
                  name="title"
                  value={currentScenario.name}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-description" className="block text-gray-700 text-sm font-bold mb-2">Описание:</label>
                <textarea
                  id="edit-scenario-description"
                  name="description"
                  value={currentScenario.description}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-sphere" className="block text-gray-700 text-sm font-bold mb-2">Сфера:</label>
                <input
                  type="text"
                  id="edit-scenario-sphere"
                  name="sphere"
                  value={currentScenario.sphere}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, sphere: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: Работа, Учеба, Личная жизнь"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-situation" className="block text-gray-700 text-sm font-bold mb-2">Ситуация:</label>
                <input
                  type="text"
                  id="edit-scenario-situation"
                  name="situation"
                  value={currentScenario.situation}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, situation: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: Собеседование, Переговоры"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-mood" className="block text-gray-700 text-sm font-bold mb-2">Настроение:</label>
                <input
                  type="text"
                  id="edit-scenario-mood"
                  name="mood"
                  value={currentScenario.mood}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, mood: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: Нейтральное, Позитивное, Агрессивное"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-language" className="block text-gray-700 text-sm font-bold mb-2">Язык:</label>
                <input
                  type="text"
                  id="edit-scenario-language"
                  name="language"
                  value={currentScenario.language}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, language: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: Русский, Английский"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-user-role" className="block text-gray-700 text-sm font-bold mb-2">Роль пользователя:</label>
                <input
                  type="text"
                  id="edit-scenario-user-role"
                  name="user_role"
                  value={currentScenario.user_role}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, user_role: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: клиент, сотрудник"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-ai-role" className="block text-gray-700 text-sm font-bold mb-2">Роль AI:</label>
                <input
                  type="text"
                  id="edit-scenario-ai-role"
                  name="ai_role"
                  value={currentScenario.ai_role}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, ai_role: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="Например: администратор отеля, менеджер"
                />
              </div>
              <div>
                <label htmlFor="edit-scenario-ai-behavior" className="block text-gray-700 text-sm font-bold mb-2">Поведение AI:</label>
                <textarea
                  id="edit-scenario-ai-behavior"
                  name="ai_behavior"
                  value={currentScenario.ai_behavior}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, ai_behavior: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                  required
                  placeholder="Например: недовольный клиент, спокойный сотрудник"
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-scenario-prompt-template" className="block text-gray-700 text-sm font-bold mb-2">Промпт-шаблон:</label>
                <select
                  id="edit-scenario-prompt-template"
                  name="prompt_template_id"
                  value={currentScenario.prompt_template_id || ''}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, prompt_template_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Выберите промпт-шаблон (необязательно)</option>
                  {promptTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="edit-scenario-is-template"
                  name="is_template"
                  checked={currentScenario.is_template}
                  onChange={(e) => setCurrentScenario({ ...currentScenario, is_template: e.target.checked })}
                  className="mr-2 leading-tight"
                />
                <label htmlFor="edit-scenario-is-template" className="text-gray-700 text-sm font-bold">Является шаблоном (не будет отображаться для пользователей)</label>
              </div>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => { setTemplateScenarioContext(currentScenario.id); setShowPromptTemplatesModal(true); }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Управление шаблонами системных промптов
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditScenarioModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-sm">
            <div className="mb-4 text-lg font-semibold text-gray-800">{confirmModal.text}</div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                onClick={() => setConfirmModal({ show: false, onConfirm: null, text: '' })}
              >
                Отмена
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={confirmModal.onConfirm}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя навигационная панель */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-40 flex justify-around md:hidden">
        <button onClick={() => { setActiveTab('users'); document.getElementById('admin-users')?.scrollIntoView({behavior: 'smooth'}); }} className={`flex flex-col items-center py-2 px-3 flex-1 ${activeTab==='users' ? 'text-blue-700' : 'text-gray-500'}`}> <UserGroupIcon className="w-6 h-6 mb-1"/> <span className="text-xs">Пользователи</span> </button>
        <button onClick={() => { setActiveTab('moderators'); document.getElementById('admin-moderators')?.scrollIntoView({behavior: 'smooth'}); }} className={`flex flex-col items-center py-2 px-3 flex-1 ${activeTab==='moderators' ? 'text-blue-700' : 'text-gray-500'}`}> <UserGroupIcon className="w-6 h-6 mb-1"/> <span className="text-xs">Модераторы</span> </button>
        <button onClick={() => { setActiveTab('achievements'); document.getElementById('admin-achievements')?.scrollIntoView({behavior: 'smooth'}); }} className={`flex flex-col items-center py-2 px-3 flex-1 ${activeTab==='achievements' ? 'text-blue-700' : 'text-gray-500'}`}> <ChartBarIcon className="w-6 h-6 mb-1"/> <span className="text-xs">Достижения</span> </button>
        <button onClick={() => { setActiveTab('scenarios'); document.getElementById('admin-scenarios')?.scrollIntoView({behavior: 'smooth'}); }} className={`flex flex-col items-center py-2 px-3 flex-1 ${activeTab==='scenarios' ? 'text-blue-700' : 'text-gray-500'}`}> <ChartBarIcon className="w-6 h-6 mb-1"/> <span className="text-xs">Сценарии</span> </button>
        <button onClick={() => { setActiveTab('stats'); document.getElementById('admin-stats')?.scrollIntoView({behavior: 'smooth'}); }} className={`flex flex-col items-center py-2 px-3 flex-1 ${activeTab==='stats' ? 'text-blue-700' : 'text-gray-500'}`}> <CogIcon className="w-6 h-6 mb-1"/> <span className="text-xs">Статистика</span> </button>
      </nav>

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
      {/* Модальное окно добавления организации */}
      {showAddOrganizationModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors relative animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Добавить организацию</h2>
              <button onClick={() => setShowAddOrganizationModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            <form onSubmit={handleAddOrganizationSubmit} className="space-y-6">
              <div>
                <label htmlFor="organization-name" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Название:</label>
                <input
                  type="text"
                  id="organization-name"
                  name="name"
                  value={organizationFormData.name}
                  onChange={(e) => setOrganizationFormData({ ...organizationFormData, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm"
                  required
                  placeholder="Введите название организации"
                />
              </div>
              <div>
                <label htmlFor="organization-description" className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Описание:</label>
                <textarea
                  id="organization-description"
                  name="description"
                  value={organizationFormData.description}
                  onChange={(e) => setOrganizationFormData({ ...organizationFormData, description: e.target.value })}
                  className="w-full min-h-[60px] h-24 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors shadow-sm resize-none"
                  required
                  placeholder="Введите описание организации"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddOrganizationModal(false)}
                  className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-bold py-2 px-6 rounded-xl transition-colors shadow"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования организации */}
      {showEditOrganizationModal && currentOrganization && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 sm:p-6 w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Редактировать организацию: {currentOrganization.name}</h2>
              <button onClick={() => setShowEditOrganizationModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditOrganizationSubmit}>
              <div className="mb-4">
                <label htmlFor="edit-organization-name" className="block text-gray-700 text-sm font-bold mb-2">Название:</label>
                <input
                  type="text"
                  id="edit-organization-name"
                  name="name"
                  value={currentOrganization.name}
                  onChange={(e) => setCurrentOrganization({ ...currentOrganization, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-organization-description" className="block text-gray-700 text-sm font-bold mb-2">Описание:</label>
                <textarea
                  id="edit-organization-description"
                  name="description"
                  value={currentOrganization.description}
                  onChange={(e) => setCurrentOrganization({ ...currentOrganization, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditOrganizationModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно пользователей организации */}
      {showOrganizationUsersModal && currentOrganization && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Пользователи организации: {currentOrganization.name}</h2>
              <button onClick={() => setShowOrganizationUsersModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">В организации</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{organizationUsers.length || 0}</span>
                </div>
                <div className="border rounded p-2 max-h-72 overflow-y-auto">
                  {(organizationUsers && organizationUsers.length > 0) ? (
                    organizationUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center py-1 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                        <span className="truncate mr-2">{u.username} ({u.email})</span>
                        <button
                          onClick={() => handleRemoveUserFromOrganization(currentOrganization.id, u.id)}
                          className="bg-red-500 hover:bg-red-700 text-white rounded px-2 py-1 text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500 dark:text-gray-400">Пользователи не добавлены</div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Доступные пользователи</h3>
                  <button 
                    onClick={() => fetchAvailableUsers(currentOrganization.id)}
                    className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    Обновить
                  </button>
                </div>
                <div className="border rounded p-2 max-h-72 overflow-y-auto">
                  {(availableUsers && availableUsers.length > 0) ? (
                    availableUsers.map(user => (
                      <div key={user.id} className="flex justify-between items-center py-1 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                        <span className="truncate mr-2">{user.username} ({user.email})</span>
                        <button 
                          onClick={() => handleAddUserToOrganization(currentOrganization.id, user.id)}
                          className="bg-green-500 text-white rounded px-2 py-1 text-sm hover:bg-green-700 transition"
                        >
                          Добавить
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500 dark:text-gray-400">Нет доступных пользователей для добавления</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления пользователя в организацию */}
      {showAddUserToOrgModal && currentOrganization && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Добавить пользователя в организацию</h2>
              <button onClick={() => setShowAddUserToOrgModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {availableUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span>{user.username} ({user.email})</span>
                  <button 
                    onClick={() => handleAddUserToOrganization(currentOrganization.id, user.id)}
                    className="bg-green-500 text-white rounded px-2 py-1 text-sm hover:bg-green-700 transition"
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно сценариев организации */}
      {showOrgScenariosModal && currentOrgForScenarios && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Сценарии организации: {currentOrgForScenarios.name}</h2>
              <button onClick={() => setShowOrgScenariosModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {loadingOrgScenarios ? (
              <div className="text-blue-500 animate-pulse">Загрузка...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Назначенные</h3>
                  <ul className="border rounded p-2 max-h-72 overflow-y-auto">
                    {orgAssignedScenarios.length === 0 ? (
                      <li className="text-gray-400">Нет назначенных сценариев</li>
                    ) : (
                      orgAssignedScenarios.map(s => (
                        <li key={s.id} className="flex justify-between items-center py-1">
                          <span>{s.name}</span>
                          <button
                            onClick={() => handleUnassignScenarioFromOrg(currentOrgForScenarios.id, s.id)}
                            className="bg-red-500 hover:bg-red-700 text-white rounded px-2 py-1 text-sm"
                          >
                            Удалить
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Доступные</h3>
                  <ul className="border rounded p-2 max-h-72 overflow-y-auto">
                    {orgAvailableScenarios.length === 0 ? (
                      <li className="text-gray-400">Нет доступных сценариев</li>
                    ) : (
                      orgAvailableScenarios.map(s => (
                        <li key={s.id} className="flex justify-between items-center py-1">
                          <span>{s.name}</span>
                          <button
                            onClick={() => handleAssignScenarioToOrg(currentOrgForScenarios.id, s.id)}
                            className="bg-green-500 hover:bg-green-700 text-white rounded px-2 py-1 text-sm"
                          >
                            Добавить
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно шаблонов системных промптов */}
      {showPromptTemplatesModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Шаблоны системных промптов</h2>
              <button onClick={() => setShowPromptTemplatesModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {isSyncingTemplates && <div className="mb-3 text-xs text-gray-500">Синхронизация привязок...</div>}
            {syncError && <div className="mb-3 text-xs text-red-500">{syncError}</div>}

            {/* Упрощенная форма создания шаблона */}
            <form onSubmit={handleCreatePromptTemplate} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <input
                type="text"
                placeholder="Название шаблона"
                value={promptTemplateForm.name}
                onChange={e => setPromptTemplateForm(p => ({ ...p, name: e.target.value }))}
                className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-gray-100"
                required
              />
              <input
                type="text"
                placeholder="Краткое описание"
                value={promptTemplateForm.description}
                onChange={e => setPromptTemplateForm(p => ({ ...p, description: e.target.value }))}
                className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-gray-100"
                required
              />
              <textarea
                placeholder="Опишите, как должен работать ИИ (роль, поведение, стиль общения)"
                value={promptTemplateForm.prompt}
                onChange={e => setPromptTemplateForm(p => ({ ...p, prompt: e.target.value }))}
                className="border rounded-lg px-3 py-2 md:col-span-2 min-h-[120px] dark:bg-gray-800 dark:text-gray-100"
                required
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setPromptTemplateForm({ name: '', description: '', prompt: '' })} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Очистить</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white">Создать шаблон</button>
              </div>
            </form>

            {/* Список шаблонов */}
            <div className="overflow-x-auto border rounded-xl dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    <th className="p-2 text-left">Название</th>
                    <th className="p-2 text-left">Описание</th>
                    <th className="p-2 text-left hidden md:table-cell">Обновление</th>
                    <th className="p-2 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {promptTemplates.map((t) => (
                    <tr key={t.id} className="border-t dark:border-gray-700">
                      <td className="p-2">
                        <input value={t.name || ''} onChange={e => setPromptTemplates(list => list.map(x => x.id===t.id ? { ...x, name: e.target.value } : x))} className="border rounded px-2 py-1 w-full dark:bg-gray-800 dark:text-gray-100" disabled={t.is_builtin || t.id==='__builtin__'} />
                      </td>
                      <td className="p-2">
                        <input value={t.description || ''} onChange={e => setPromptTemplates(list => list.map(x => x.id===t.id ? { ...x, description: e.target.value } : x))} className="border rounded px-2 py-1 w-full dark:bg-gray-800 dark:text-gray-100" disabled={t.is_builtin || t.id==='__builtin__'} />
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        {t.is_builtin || t.id==='__builtin__' ? (
                          <span className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Системный</span>
                        ) : (
                        <button onClick={() => handleUpdatePromptTemplate(t)} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">Сохранить</button>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          {activePromptTemplateId === t.id ? (
                            <span className="px-3 py-1 rounded bg-emerald-600 text-white">Активный</span>
                          ) : (
                            <button onClick={() => handleActivatePromptTemplate(t.id)} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white">Сделать активным</button>
                          )}
                          {activePromptTemplateId === t.id && (
                            <button onClick={handleClearActivePromptTemplate} className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white">Сбросить активный</button>
                          )}
                          <button onClick={() => { setPreviewTemplate(t); setPreviewInput(''); setPreviewResult(''); setShowPreviewModal(true); }} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Проверить</button>
                          <button onClick={() => handleEditTemplateContent(t)} className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white">Просмотреть содержимое</button>
                          {t.is_builtin || t.id==='__builtin__' ? null : (
                            <>
                          <button onClick={() => handleUpdatePromptTemplate(t)} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white md:hidden">Сохранить</button>
                          <button onClick={() => handleDeletePromptTemplate(t.id)} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Удалить</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {promptTemplates.length === 0 && (
                    <tr><td className="p-3 text-center text-gray-500 dark:text-gray-400" colSpan={4}>Шаблонов пока нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно предпросмотра системного промпта */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Предпросмотр системного промпта</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Шаблон: <b>{previewTemplate.name || previewTemplate.title}</b></div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Черновой ввод (опционально):</label>
            <textarea
              value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 dark:bg-gray-800 dark:text-gray-100 mb-3"
              rows={4}
              placeholder="Напишите пример реплики пользователя или контекста"
            />
            <div className="flex flex-wrap gap-2 justify-end mb-3">
              <button
                onClick={() => {
                  // Сборка системного промпта из полей шаблона
                  try {
                    const parts = [];
                    if (previewTemplate.content_start) parts.push(previewTemplate.content_start);
                    if (previewTemplate.sections_json) {
                      try {
                        const js = typeof previewTemplate.sections_json === 'string' ? JSON.parse(previewTemplate.sections_json) : previewTemplate.sections_json;
                        if (js.role) parts.push(`Роль: ${js.role}`);
                        if (js.behavior) parts.push(`Поведение: ${js.behavior}`);
                        if (Array.isArray(js.guidelines) && js.guidelines.length) {
                          parts.push(`Рекомендации:\n- ${js.guidelines.join('\n- ')}`);
                        }
                      } catch {}
                    }
                    if (previewTemplate.forbidden_words) parts.push(`Избегай: ${previewTemplate.forbidden_words}`);
                    if (previewTemplate.content_continue) parts.push(previewTemplate.content_continue);
                    if (previewInput && previewInput.trim()) parts.push(`Контекст: ${previewInput.trim()}`);
                    setPreviewResult(parts.filter(Boolean).join('\n\n'));
                  } catch {
                    setPreviewResult('Не удалось собрать системный промпт');
                  }
                }}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Проверить (диалог)
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch('/api/chat/prompt-templates/preview', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        content_start: previewTemplate.content_start || '',
                        content_continue: previewTemplate.content_continue || '',
                        forbidden_words: previewTemplate.forbidden_words || '',
                        sections_json: previewTemplate.sections_json || null,
                        context: previewInput || ''
                      })
                    });
                    if (!res.ok) throw new Error('Сервер не смог собрать предпросмотр');
                    const data = await res.json();
                    setPreviewResult(data.dialog_prompt || '');
                    setPreviewAnalysisResult(data.analysis_prompt || '');
                  } catch (e) {
                    toast.error(e.message || 'Ошибка предпросмотра');
                  }
                }}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Собрать на сервере
              </button>
              <button
                onClick={() => {
                  try {
                    const base = [];
                    base.push('Проанализируй диалог по обслуживанию клиентов на русском языке:');
                    const js = (() => { try { return typeof previewTemplate.sections_json === 'string' ? JSON.parse(previewTemplate.sections_json) : previewTemplate.sections_json; } catch { return null; } })();
                    if (js && js.role) base.push(`Роль ИИ: ${js.role}`);
                    if (js && js.behavior) base.push(`Поведение: ${js.behavior}`);
                    base.push('Диалог:\n<подставьте текст диалога>');
                    base.push('Дай краткий анализ (не более 300 слов):');
                    base.push('1. Как прошел разговор');
                    base.push('2. Какие навыки общения показал пользователь');
                    base.push('3. Что можно улучшить');
                    base.push('4. Практические рекомендации');
                    base.push('Отвечай только на русском языке, будь конструктивен.');
                    setPreviewAnalysisResult(base.join('\n'));
                  } catch {
                    setPreviewAnalysisResult('Не удалось собрать промпт анализа');
                  }
                }}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Показать промпт анализа
              </button>
            </div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Итоговый системный промпт:</label>
            <pre className="whitespace-pre-wrap border rounded-xl p-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">{previewResult || 'Нажмите «Проверить (диалог)», чтобы увидеть результат'}</pre>
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Промпт для анализа:</label>
              <pre className="whitespace-pre-wrap border rounded-xl p-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">{previewAnalysisResult || 'Нажмите «Показать промпт анализа», чтобы увидеть результат'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования содержимого шаблона */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{editingTemplateReadOnly ? 'Просмотр системного шаблона' : 'Редактирование содержимого шаблона'}</h2>
              <button onClick={() => setShowEditTemplateModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateContent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Название"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate(p => ({ ...p, name: e.target.value }))}
                  className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-gray-100"
                  required
                  disabled={editingTemplateReadOnly}
                />
                <input
                  type="text"
                  placeholder="Описание"
                  value={editingTemplate.description}
                  onChange={e => setEditingTemplate(p => ({ ...p, description: e.target.value }))}
                  className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-gray-100"
                  required
                  disabled={editingTemplateReadOnly}
                />
              </div>
              <textarea
                placeholder="Опишите, как должен работать ИИ (роль, поведение, стиль общения)"
                value={editingTemplate.prompt || ''}
                onChange={e => setEditingTemplate(p => ({ ...p, prompt: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full min-h-[120px] dark:bg-gray-800 dark:text-gray-100"
                required
                disabled={editingTemplateReadOnly}
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditTemplateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Закрыть</button>
                {editingTemplateReadOnly ? null : (
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white">Сохранить изменения</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 