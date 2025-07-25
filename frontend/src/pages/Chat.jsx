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

  useEffect(() => {
    if (!scenario) {
      navigate('/scenarios');
    } else {
      const startSession = async () => {
        try {
          setLoading(true);
          const res = await fetch('/api/chat/session/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({ scenario_id: scenario.id }),
          });
          if (!res.ok) throw new Error('Не удалось начать сессию.');
          const data = await res.json();
          setDialogId(data.dialog_id);
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
        try {
          setLoading(true);
          const res = await fetch(`/api/chat/session/${dialogId}/messages`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Не удалось загрузить историю сообщений.');
          const data = await res.json();
          const formattedMessages = data.messages.map(m => ({
            role: m.sender,
            text: m.text,
          }));
          setMessages(formattedMessages);
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

  // Функция для ручного скролла (например, по кнопке)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (customText) => {
    if (loading) return;
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || !dialogId) return;
    setInput('');
    setError(null);
    // Оптимистично добавляем сообщение пользователя
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
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
    if (isTimed && startTime) {
      const finishTime = Date.now();
      setEndTime(finishTime);
      const dur = Math.floor((finishTime - startTime) / 1000);
      setDuration(dur);
      // Отправляем duration на backend
      try {
        const resp = await fetch(`/api/chat/session/${dialogId}/finish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ duration: dur }),
        });
        if (!resp.ok) {
          const data = await resp.json();
          if (data.error && data.error.includes('Диалог уже завершен')) {
            setError('Диалог уже завершён.');
            return;
          }
        }
      } catch (e) {
        setError('Ошибка при завершении диалога.');
        return;
      }
    }
    await sendMessage('ЗАВЕРШИТЬ СИМУЛЯЦИЮ');
  };

  return (
    <div className="min-h-screen bg-[#F1F8FF] dark:bg-gray-900 flex flex-col items-center py-2 sm:py-8 px-0.5 sm:px-2 overflow-x-hidden">
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
      <div className="w-full max-w-2xl bg-white dark:bg-[#23272f] rounded-2xl shadow-xl p-1.5 sm:p-6 flex flex-col h-[80vh] min-h-0">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="mb-1 sm:mb-4">
            <h1 className="text-base sm:text-2xl font-bold text-blue-900 dark:text-white break-words leading-tight">Диалог по сценарию</h1>
            <div className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mt-0.5 break-words">{scenario?.name} — {scenario?.description}</div>
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
            {userScrolledUp && (
              <button
                onClick={scrollToBottom}
                className="absolute right-1.5 sm:right-4 bottom-1.5 sm:bottom-4 bg-blue-600 text-white rounded-full w-7 h-7 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg z-20 hover:bg-blue-800 transition"
                style={{boxShadow: '0 2px 12px rgba(0,0,0,0.15)'}}
                aria-label="Прокрутить вниз"
              >
                <FaArrowDown size={15} className="sm:hidden" />
                <FaArrowDown size={24} className="hidden sm:inline" />
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-auto">
            <input
              className="flex-1 border border-gray-300 dark:border-[#444] rounded-lg px-2.5 sm:px-4 py-1.5 text-xs sm:text-base focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 min-w-0 bg-white dark:bg-[#23272f] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              type="text"
              placeholder={!dialogId ? "Ожидание начала сессии..." : "Введите сообщение..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(); }}
              disabled={loading || !dialogId || analysis}
            />
            <button
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold px-3 sm:px-6 py-1.5 rounded-lg transition disabled:opacity-50 text-xs sm:text-base min-w-[70px] sm:min-w-[100px] dark:bg-blue-600 dark:hover:bg-blue-800 dark:text-white"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || !dialogId || analysis}
            >
              {loading ? '...' : 'Отправить'}
            </button>
            <button
              className="bg-red-600 hover:bg-red-800 text-white font-bold px-3 sm:px-6 py-1.5 rounded-lg transition disabled:opacity-50 text-xs sm:text-base min-w-[70px] sm:min-w-[100px] dark:bg-red-600 dark:hover:bg-red-800 dark:text-white"
              onClick={handleFinish}
              disabled={loading || !dialogId || analysis}
            >
              Завершить симуляцию
            </button>
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
    </div>
  );
};

export default Chat; 