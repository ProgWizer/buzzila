import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowDown } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Новый компонент для индикатора печати
const TypingIndicator = () => (
  <div className="typing-indicator-ui">
    <span className="icon">✍️</span>
    <span className="text">Печатает</span>
    <span className="dot">.</span>
    <span className="dot">.</span>
    <span className="dot">.</span>
  </div>
);

// Новый компонент модального окна анализа
const AnalysisModal = ({ analysis, error, onClose }) => {
  // Проверяем, активна ли тёмная тема
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: isDark ? '#23272f' : 'white',
        color: isDark ? '#e5e7eb' : '#22577A',
        borderRadius: 14,
        maxWidth: 420,
        width: '98%',
        padding: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        border: isDark ? '1.5px solid #444' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{fontSize: 15, fontWeight: 700, color: isDark ? '#e5e7eb' : '#22577A', margin: 0}}>Анализ диалога</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: isDark ? '#aaa' : '#888', fontSize: 22, fontWeight: 700, cursor: 'pointer', padding: 4, marginLeft: 8 }}>&times;</button>
        </div>
        <div style={{
          whiteSpace: 'pre-line',
          color: isDark ? '#e5e7eb' : '#22577A',
          marginBottom: 12,
          minHeight: 50,
          maxHeight: '40vh',
          overflowY: 'auto',
          fontSize: 13
        }}>
          {error ? (
            <span style={{color: 'red'}}>Ошибка при получении анализа. Попробуйте позже.</span>
          ) : analysis ? analysis : 'Загрузка анализа...'}
        </div>
        <button
          onClick={onClose}
          style={{background: isDark ? '#22577A' : '#22577A', color: 'white', border: 'none', borderRadius: 7, padding: '12px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 4}}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

// Новый компонент для отображения достижений
const AchievementsModal = ({ achievements, onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.35)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      background: 'white', borderRadius: 14, maxWidth: '95vw', width: '94%', padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{fontSize: 15, fontWeight: 700, color: '#22577A', margin: 0}}>Поздравляем! Новые достижения:</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 22, fontWeight: 700, cursor: 'pointer', padding: 4, marginLeft: 8 }}>&times;</button>
      </div>
      <ul style={{marginBottom: 10, color: '#22577A', fontSize: 13, fontWeight: 500}}>
        {achievements.map((ach, idx) => (
          <li key={idx} style={{marginBottom: 4}}>🏆 {ach}</li>
        ))}
      </ul>
      <button
        onClick={onClose}
        style={{background: '#22577A', color: 'white', border: 'none', borderRadius: 7, padding: '12px 0', fontWeight: 600, fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 4}}>
        Закрыть
      </button>
    </div>
  </div>
);

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scenario = location.state?.scenario || null;
  const isTimed = location.state?.isTimed || false;
  
  // Хелпер форматирования времени без миллисекунд
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const [dialogId, setDialogId] = useState(null);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text: string, typing?: boolean }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const chatContainerRef = useRef(null);
  const [analysisError, setAnalysisError] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [analysisClosed, setAnalysisClosed] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [timer, setTimer] = useState(0);
  // Новые состояния для истории и статуса диалога
  const [sessions, setSessions] = useState([]);
  const [dialogStatus, setDialogStatus] = useState('active'); // 'active' | 'completed'
  const [selectedScenarioName, setSelectedScenarioName] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'completed'
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);

  // Хелпер: проверяем наличие JWT и мягко редиректим
  const ensureTokenOrRedirect = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Требуется вход. Пожалуйста, авторизуйтесь.');
      navigate('/login');
      return null;
    }
    return token;
  };

  // Загрузка истории сессий
  const fetchSessions = async (status = filterStatus, archivedOnly = showArchived) => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    try {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('status', status);
      if (archivedOnly) qs.set('archived_only', 'true');
      const res = await fetch(`/api/chat/sessions${qs.toString() ? `?${qs.toString()}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Не удалось загрузить список диалогов.');
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (e) {}
  };

  const handleChangeFilter = (newFilter) => {
    setFilterStatus(newFilter);
    fetchSessions(newFilter, showArchived);
  };

  const toggleArchivedView = () => {
    const next = !showArchived;
    setShowArchived(next);
    // При показе архива игнорируем статус фильтра, показываем все архивные
    fetchSessions('all', next);
  };

  const handleArchive = async (dialogIdToArchive) => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/session/${dialogIdToArchive}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Не удалось архивировать диалог');
      toast.success('Диалог скрыт');
      fetchSessions(filterStatus, showArchived);
      if (dialogId === dialogIdToArchive) {
        setDialogId(null);
        setMessages([]);
        setDialogStatus('active');
        setSelectedScenarioName(null);
      }
    } catch (e) {
      toast.error('Ошибка при скрытии диалога');
    }
  };

  const handleRestore = async (dialogIdToRestore) => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/session/${dialogIdToRestore}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Не удалось восстановить диалог');
      toast.success('Диалог восстановлен');
      fetchSessions(filterStatus, showArchived);
      if (dialogId === dialogIdToRestore && showArchived) {
        // Если в архивном режиме восстановили текущий — уберём из просмотра
        setDialogId(null);
        setMessages([]);
        setDialogStatus('active');
        setSelectedScenarioName(null);
      }
    } catch (e) {
      toast.error('Ошибка при восстановлении диалога');
    }
  };

  // УБРАН автоскролл вниз — пользователь контролирует позицию сам
  // useEffect(() => {
  //   if (!userScrolledUp) {
  //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [messages, userScrolledUp]);

  useEffect(() => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!scenario) {
      // Нет сценария — просто режим истории
    } else {
      const startSession = async () => {
        const token = ensureTokenOrRedirect();
        if (!token) return;
        try {
          setLoading(true);
          const res = await fetch('/api/chat/session/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ scenario_id: scenario.id }),
          });
          if (!res.ok) throw new Error('Не удалось начать сессию.');
          const data = await res.json();
          setDialogId(data.dialog_id);
          setDialogStatus('active');
          setSelectedScenarioName(scenario?.name || null);
          // Если сервер вернул первое сообщение ИИ — добавим сразу
          if (data.first_ai_message && data.first_ai_message.text) {
            setMessages([{ role: data.first_ai_message.sender, text: data.first_ai_message.text }]);
          } else {
            setMessages([]);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      startSession();
    }
  }, [scenario, navigate]);

  useEffect(() => {
    if (dialogId) {
      const fetchMessages = async () => {
        const token = ensureTokenOrRedirect();
        if (!token) return;
        try {
          setLoading(true);
          const res = await fetch(`/api/chat/session/${dialogId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Не удалось загрузить историю сообщений.');
          const data = await res.json();
          const formattedMessages = data.messages.map(m => ({
            role: m.sender,
            text: m.text,
          }));
          setMessages(formattedMessages);
          if (data.status) setDialogStatus(data.status);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [dialogId]);

  useEffect(() => {
    if (analysisClosed) {
      setAnalysisClosed(false);
      setMessages([]);
      setDialogId(null);
      setInput('');
      setError(null);
      setAnalysis(null);
      setNewAchievements([]);
      // Обновляем историю
      fetchSessions();
      navigate('/achievements');
    }
  }, [analysisClosed, navigate]);

  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      newAchievements.forEach(ach => {
        toast.success(`Достижение выполнено: ${ach}`, {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'colored',
        });
      });
    }
  }, [newAchievements]);

  useEffect(() => {
    if (isTimed && dialogId && !startTime) {
      setStartTime(Date.now());
      setTimer(0);
    }
  }, [isTimed, dialogId, startTime]);

  useEffect(() => {
    let interval = null;
    if (isTimed && startTime && !endTime) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isTimed, startTime, endTime]);

  // Функция выбора сессии из истории
  const handleSelectSession = async (session) => {
    // Загружаем выбранный диалог в режим просмотра (без автоскролла)
    setDialogId(session.id);
    setSelectedScenarioName(session.scenario_name || null);
    setAnalysis(null);
    setShowAnalysisModal(false);
    setNewAchievements([]);
    setError(null);
  };

  // Функция для ручного скролла (например, по кнопке)
  const scrollToBottom = () => {
    // Отключено по требованию: не прокручиваем автоматически
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (customText) => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    if (loading) return;
    if (dialogStatus !== 'active') return; // Блокируем отправку в завершённых диалогах
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || !dialogId) return;
    setInput('');
    setError(null);
    // Оптимистично добавляем сообщение пользователя (без автоскролла)
    setMessages(prev => [
      ...prev,
      { role: 'user', text: textToSend }
    ]);
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/session/${dialogId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: textToSend }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        setError('Ошибка сервера: получен невалидный ответ.');
        return;
      }
      if (data.analysis) {
        setAnalysis(data.analysis);
        setShowAnalysisModal(true);
        setAnalysisError(false);
        setMessages(prev => [...prev, { role: 'system', text: data.analysis }]);
        if (data.achievements && data.achievements.length > 0) {
          setNewAchievements(data.achievements);
        }
        setDialogStatus('completed'); // Диалог завершён
        fetchSessions();
      } else if (data.user_message && data.ai_message) {
        // Не добавляем user_message, так как уже добавили оптимистично
        setMessages(prev => [
          ...prev,
          { role: data.ai_message.sender, text: data.ai_message.text }
        ]);
      } else if (data.sender && data.text) {
        // Если это ответ бота
        if (data.sender !== 'user') {
          setMessages(prev => [
            ...prev,
            { role: data.sender, text: data.text }
          ]);
        }
      } else if (data.error) {
        setAnalysisError(true);
        setShowAnalysisModal(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Завершение симуляции 
  const handleFinish = async () => {
    const token = ensureTokenOrRedirect();
    if (!token) return;
    if (loading) return; // Предотвращаем двойные вызовы
    if (dialogStatus !== 'active') return; // Уже завершён
    
    let calculatedDuration = 0;
    
    // Если диалог таймированный, рассчитываем длительность
    if (isTimed && startTime) {
      const finishTime = Date.now();
      setEndTime(finishTime);
      calculatedDuration = Math.floor((finishTime - startTime) / 1000);
      setDuration(calculatedDuration);
    }
    
    setLoading(true);
    setError(null);
    
    // Оптимистично добавляем сообщение пользователя
    setMessages(prev => [
      ...prev,
      { role: 'user', text: 'ЗАВЕРШИТЬ СИМУЛЯЦИЮ' }
    ]);
    
    try {
      // Отправляем сообщение о завершении с длительностью
      const res = await fetch(`/api/chat/session/${dialogId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: 'ЗАВЕРШИТЬ СИМУЛЯЦИЮ',
          duration: calculatedDuration // Отправляем duration вместе с сообщением
        }),
      });
  
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Ошибка сервера: получен невалидный ответ.');
      }
  
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при завершении диалога');
      }
  
      // Обрабатываем успешный ответ
      if (data.analysis) {
        setAnalysis(data.analysis);
        setShowAnalysisModal(true);
        setAnalysisError(false);
        
        // Добавляем системное сообщение с анализом
        if (data.analysis_message) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            text: data.analysis_message.text 
          }]);
        }
        
        // Обрабатываем достижения
        if (data.achievements && data.achievements.length > 0) {
          setNewAchievements(data.achievements);
        }
        // Диалог завершён, блокируем ввод
        setDialogStatus('completed');
        fetchSessions();
      } else if (data.error) {
        setAnalysisError(true);
        setShowAnalysisModal(true);
        setError(data.error);
      }
  
    } catch (err) {
      console.error('Ошибка при завершении диалога:', err);
      setError(err.message);
      setAnalysisError(true);
      setShowAnalysisModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isInputDisabled = loading || !dialogId || analysis || dialogStatus !== 'active';

  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-[#F1F8FF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-2 sm:py-10 px-2 sm:px-6 transition-colors">
      {/* Стили для typing-indicator и анализа */}
      <style>{`
        .typing-indicator-ui {
          display: inline-flex;
          align-items: center;
          background: #e3e7f1;
          color: #2d3748;
          border-radius: 18px;
          padding: 8px 18px;
          margin: 8px 0 8px 10px;
          font-size: 15px;
          font-style: italic;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          min-width: 100px;
          font-weight: 500;
        }
        .dark .typing-indicator-ui {
          background: #23272f;
          color: #e5e7eb;
        }
        .typing-indicator-ui .icon {
          margin-right: 8px;
          font-size: 18px;
        }
        .typing-indicator-ui .text {
          margin-right: 6px;
        }
        .typing-indicator-ui .dot {
          animation: blink 1.2s infinite both;
          font-weight: bold;
          font-size: 18px;
        }
        .typing-indicator-ui .dot:nth-child(3) { animation-delay: 0.2s; }
        .typing-indicator-ui .dot:nth-child(4) { animation-delay: 0.4s; }
        .typing-indicator-ui .dot:nth-child(5) { animation-delay: 0.6s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        @media (min-width: 1024px) {
          .chat-main-flex { flex-direction: row; }
          .chat-panel { width: 70%; }
          .analysis-panel { width: 30%; min-width: 320px; max-width: 400px; }
        }
        @media (max-width: 1023px) {
          .chat-main-flex { flex-direction: column; }
          .chat-panel, .analysis-panel { width: 100%; }
        }
        .panel-btn { border-radius: 10px; font-weight: 700; font-size: 15px; padding: 14px 0; min-width: 120px; min-height: 44px; }
        input, textarea { font-size: 15px !important; min-height: 44px; }
        .dark input, .dark textarea {
          background: #23272f !important;
          color: #e5e7eb !important;
          border-color: #444 !important;
        }
        .dark .bg-white { background: #23272f !important; }
        .dark .bg-blue-50 { background: #181c23 !important; }
        .dark .text-blue-900 { color: #e5e7eb !important; }
        .dark .text-gray-600 { color: #b0b8c1 !important; }
        .dark .text-gray-400 { color: #8a8f98 !important; }
        .dark .bg-gray-200 { background: #23272f !important; color: #e5e7eb !important; }
        .dark .bg-blue-600 { background: #2563eb !important; }
        .dark .bg-green-100 { background: #1e293b !important; color: #a7f3d0 !important; border-color: #10b981 !important; }
        .dark .text-green-900 { color: #6ee7b7 !important; }
        .dark .border-green-400 { border-color: #10b981 !important; }
        .dark .bg-red-600 { background: #dc2626 !important; }
        .dark .hover\:bg-red-800:hover { background: #991b1b !important; }
        .dark .hover\:bg-blue-800:hover { background: #1e40af !important; }
        .dark .text-white { color: #e5e7eb !important; }
        .dark .border-gray-300 { border-color: #444 !important; }
        .dark .rounded-2xl { background: #23272f !important; }
        @media (max-width: 640px) {
          .panel-btn { font-size: 14px !important; padding: 12px 0 !important; min-width: 90px !important; min-height: 40px !important; }
          input, textarea { font-size: 13.5px !important; min-height: 38px; }
        }
      `}</style>
      <ToastContainer />
      {showAnalysisModal && (
        <AnalysisModal
          analysis={analysis}
          error={analysisError}
          onClose={() => {
            setShowAnalysisModal(false);
            setAnalysis(null);
            setAnalysisError(false);
            setAnalysisClosed(true);
          }}
        />
      )}
      {newAchievements.length > 0 && (
        <AchievementsModal
          achievements={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}
      <div className="w-full max-w-5xl flex gap-2">
        {/* Сайдбар истории (Desktop) */}
        <div className="hidden lg:block w-1/3 bg-white dark:bg-[#23272f] rounded-2xl shadow-xl p-3 h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-bold text-blue-900 dark:text-white">{showArchived ? 'Архив диалогов' : 'История диалогов'}</div>
            <button
              className={`${showArchived ? 'px-2 py-1 rounded text-xs border bg-blue-600 text-white border-blue-600' : 'px-2 py-1 rounded text-xs border border-gray-300 dark:border-[#444] text-blue-900 dark:text-white'}`}
              onClick={toggleArchivedView}
              title={showArchived ? 'Показать историю' : 'Показать архив'}
            >{showArchived ? 'История' : 'Архив'}</button>
          </div>
          {!showArchived && (
            <div className="flex gap-2 mb-3">
              <button
                className={`${filterStatus === 'all' ? 'px-2 py-1 rounded text-xs border bg-blue-600 text-white border-blue-600' : 'px-2 py-1 rounded text-xs border border-gray-300 dark:border-[#444] text-blue-900 dark:text-white'}`}
                onClick={() => handleChangeFilter('all')}
              >Все</button>
              <button
                className={`${filterStatus === 'active' ? 'px-2 py-1 rounded text-xs border bg-blue-600 text-white border-blue-600' : 'px-2 py-1 rounded text-xs border border-gray-300 dark:border-[#444] text-blue-900 dark:text-white'}`}
                onClick={() => handleChangeFilter('active')}
              >Активные</button>
              <button
                className={`${filterStatus === 'completed' ? 'px-2 py-1 rounded text-xs border bg-blue-600 text-white border-blue-600' : 'px-2 py-1 rounded text-xs border border-gray-300 dark:border-[#444] text-blue-900 dark:text-white'}`}
                onClick={() => handleChangeFilter('completed')}
              >Завершённые</button>
            </div>
          )}
          {sessions.length === 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{showArchived ? 'Архив пуст' : 'Нет сохранённых диалогов'}</div>
          )}
          <ul className="space-y-2">
            {sessions.map(s => (
              <li key={s.id}>
                <div className="w-full p-2 rounded-md border border-gray-200 dark:border-[#444]">
                  <div className="flex items-start gap-2">
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => handleSelectSession(s)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-blue-900 dark:text-white truncate">{s.scenario_name || 'Сценарий'}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${s.status === 'completed' ? 'bg-green-100 text-green-900 dark:bg-[#1e293b] dark:text-[#a7f3d0]' : 'bg-blue-100 text-blue-900 dark:bg-[#1e293b] dark:text-white'}`}>{s.status}</span>
                      </div>
                      {s.last_message?.text && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 overflow-hidden whitespace-nowrap text-ellipsis">{s.last_message.text}</div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-1">
                        {s.completed_at ? 'Завершён' : 'Создан'}: {formatTime(s.completed_at || s.started_at)}
                      </div>
                    </button>
                    {/* Меню действий */}
                    <div className="relative">
                      <button
                        className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2530] rounded"
                        onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                        title="Действия"
                      >⋯</button>
                      {menuOpenId === s.id && (
                        <div className="absolute right-0 mt-1 bg-white dark:bg-[#23272f] border border-gray-200 dark:border-[#444] rounded shadow z-10 min-w-[140px]">
                          {showArchived ? (
                            <button
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[#1f2530]"
                              onClick={() => { setMenuOpenId(null); handleRestore(s.id); }}
                            >Разархивировать</button>
                          ) : (
                            <button
                              className="w-full text-left px-3 py-2 text-xs text-red-700 hover:bg-gray-100 dark:hover:bg-[#1f2530]"
                              onClick={() => { setMenuOpenId(null); handleArchive(s.id); }}
                            >Скрыть</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Панель чата */}
        <div className="flex-1 max-w-2xl bg-white dark:bg-[#23272f] rounded-2xl shadow-xl p-1.5 sm:p-6 flex flex-col h-[80vh] min-h-0">
          {/* Кнопка открытия истории для мобильных */}
          <div className="lg:hidden mb-2 flex justify-between items-center">
            <button
              className="px-3 py-1 rounded text-xs border border-gray-300 dark:border-[#444] text-blue-900 dark:text-white"
              onClick={() => setShowHistoryMobile(true)}
            >История</button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mb-1 sm:mb-4">
              <h1 className="text-base sm:text-2xl font-bold text-blue-900 dark:text-white break-words leading-tight">Диалог по сценарию</h1>
              <div className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mt-0.5 break-words">{selectedScenarioName || scenario?.name} — {scenario?.description || ''}</div>
              {dialogStatus !== 'active' && dialogId && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Диалог завершён. Отправка сообщений недоступна.</div>
              )}
            </div>
            {error && <div className="text-red-500 text-center mb-2 text-xs sm:text-base">{error}</div>}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-1 sm:mb-4 bg-blue-50 dark:bg-[#181c23] rounded-lg p-1.5 sm:p-4 relative min-w-0"
              onScroll={e => {
                const container = e.target;
                const threshold = 120;
                const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
                setUserScrolledUp(!isAtBottom);
              }}
            >
              {messages.length === 0 && !loading && <div className="text-gray-400 text-center text-xs sm:text-base">Начните диалог с моделью…</div>}
              {loading && messages.length === 0 && <div className="text-gray-400 text-center text-xs sm:text-base">Загрузка сессии...</div>}
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-0.5 sm:mb-2 flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                  <div className={`px-2.5 sm:px-4 py-1.5 rounded-xl max-w-[90%] sm:max-w-[70%] text-xs sm:text-base transition-all duration-200 shadow ${msg.role === 'user' ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : msg.role === 'system' ? 'bg-green-100 text-green-900 border border-green-400 dark:bg-[#1e293b] dark:text-[#a7f3d0] dark:border-[#10b981]' : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'}`} style={{wordBreak: 'break-word', fontSize: '13px'}}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && !analysis && (
                <div className="mb-0.5 sm:mb-2 flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
              {/* Удалено: синяя кнопка прокрутки страницы вниз */}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-auto">
              <div className="flex items-end gap-2 mt-auto">
                <textarea
                  className="flex-1 border border-gray-300 dark:border-[#444] rounded-lg px-3 py-2 
                            text-sm sm:text-base focus:outline-none focus:border-blue-600 
                            dark:focus:border-blue-400 bg-white dark:bg-[#23272f] text-gray-900 
                            dark:text-white placeholder-gray-400 dark:placeholder-gray-400 
                            resize-none overflow-y-auto"
                  rows={1}
                  placeholder="Введите сообщение..."
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    // автоувеличение
                    e.target.style.height = 'auto';
                    const lineHeight = 24; // приблизительно
                    const maxRows = 6;
                    const maxHeight = lineHeight * maxRows;
                    e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      // новая строка
                      return; // разрешаем перенос
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!loading && dialogStatus === 'active' && input.trim()) {
                        sendMessage();
                      }
                    }
                  }}
                  disabled={isInputDisabled}
                />

                <button
                  className="bg-blue-600 hover:bg-blue-800 text-white font-bold px-4 py-2 
                            rounded-lg transition disabled:opacity-50 text-sm sm:text-base 
                            dark:bg-blue-600 dark:hover:bg-blue-800 dark:text-white"
                  onClick={() => sendMessage()}
                  disabled={isInputDisabled || !input.trim()}
                >
                  {loading ? "..." : "Отправить"}
                </button>

                <button
                  className="bg-red-600 hover:bg-red-800 text-white font-bold px-4 py-2 
                            rounded-lg transition disabled:opacity-50 text-sm sm:text-base 
                            dark:bg-red-600 dark:hover:bg-red-800 dark:text-white"
                  onClick={handleFinish}
                  disabled={loading || !dialogId || analysis || dialogStatus !== 'active'}
                >
                  Завершить
                </button>
              </div>
            </div>
            {isTimed && (
              <div className="mt-2 sm:mt-4 text-center text-xs sm:text-lg text-blue-900 font-semibold">
                {endTime ? (
                  <>Вы завершили диалог за {Math.floor(duration/60)}:{('0'+(duration%60)).slice(-2)}</>
                ) : (
                  <>Время с начала диалога: {Math.floor(timer/60)}:{('0'+(timer%60)).slice(-2)}</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Мобильная панель истории как оверлей */}
        {showHistoryMobile && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setShowHistoryMobile(false)}>
            <div className="absolute left-0 top-0 h-full w-10/12 max-w-xs bg-white dark:bg-[#23272f] shadow-xl p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-base font-bold text-blue-900 dark:text-white">{showArchived ? 'Архив' : 'История'}</div>
                <button className="px-2 py-1 text-xs border border-gray-300 dark:border-[#444] rounded" onClick={() => setShowHistoryMobile(false)}>Закрыть</button>
              </div>
              <ul className="space-y-2">
                {sessions.map(s => (
                  <li key={s.id}>
                    <button className="w-full text-left p-2 rounded-md border border-gray-200 dark:border-[#444]" onClick={() => { setShowHistoryMobile(false); handleSelectSession(s); }}>
                      <div className="text-sm font-semibold text-blue-900 dark:text-white truncate">{s.scenario_name || 'Сценарий'}</div>
                      {s.last_message?.text && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{s.last_message.text}</div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-1">{s.completed_at ? 'Завершён' : 'Создан'}: {formatTime(s.completed_at || s.started_at)}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 