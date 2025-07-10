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
const AnalysisModal = ({ analysis, error, onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      background: 'white', borderRadius: 16, maxWidth: 480, width: '90%', padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
    }}>
      <h2 style={{fontSize: 22, fontWeight: 700, color: '#22577A', marginBottom: 16}}>Анализ диалога</h2>
      <div style={{
        whiteSpace: 'pre-line',
        color: '#22577A',
        marginBottom: 24,
        minHeight: 80,
        maxHeight: '55vh',
        overflowY: 'auto'
      }}>
        {error ? (
          <span style={{color: 'red'}}>Ошибка при получении анализа. Попробуйте позже.</span>
        ) : analysis ? analysis : 'Загрузка анализа...'}
      </div>
      <button
        onClick={onClose}
        style={{background: '#22577A', color: 'white', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>
        Закрыть
      </button>
    </div>
  </div>
);

// Новый компонент для отображения достижений
const AchievementsModal = ({ achievements, onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.35)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      background: 'white', borderRadius: 16, maxWidth: 420, width: '90%', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
    }}>
      <h2 style={{fontSize: 20, fontWeight: 700, color: '#22577A', marginBottom: 12}}>Поздравляем! Новые достижения:</h2>
      <ul style={{marginBottom: 18, color: '#22577A', fontSize: 17, fontWeight: 500}}>
        {achievements.map((ach, idx) => (
          <li key={idx} style={{marginBottom: 6}}>🏆 {ach}</li>
        ))}
      </ul>
      <button
        onClick={onClose}
        style={{background: '#22577A', color: 'white', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>
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
    <div className="min-h-screen bg-[#F1F8FF] flex flex-col items-center py-8 px-2">
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
          font-size: 17px;
          font-style: italic;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          min-width: 120px;
          font-weight: 500;
        }
        .typing-indicator-ui .icon {
          margin-right: 8px;
          font-size: 20px;
        }
        .typing-indicator-ui .text {
          margin-right: 6px;
        }
        .typing-indicator-ui .dot {
          animation: blink 1.2s infinite both;
          font-weight: bold;
          font-size: 20px;
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
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 flex flex-col h-[80vh] min-h-0">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-blue-900">Диалог по сценарию</h1>
            <div className="text-gray-600 text-base mt-1">{scenario?.name} — {scenario?.description}</div>
          </div>
          {error && <div className="text-red-500 text-center mb-2">{error}</div>}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 bg-blue-50 rounded-lg p-4 relative"
            onScroll={e => {
              const container = e.target;
              const threshold = 120;
              const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
              setUserScrolledUp(!isAtBottom);
            }}
          >
            {messages.length === 0 && !loading && <div className="text-gray-400 text-center">Начните диалог с моделью…</div>}
            {loading && messages.length === 0 && <div className="text-gray-400 text-center">Загрузка сессии...</div>}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-xl max-w-[70%] text-base ${msg.role === 'user' ? 'bg-blue-600 text-white' : msg.role === 'system' ? 'bg-green-100 text-green-900 border border-green-400' : 'bg-gray-200 text-gray-900'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && !analysis && (
              <div className="mb-2 flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
            {userScrolledUp && (
              <button
                onClick={scrollToBottom}
                className="absolute right-4 bottom-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-20 hover:bg-blue-800 transition"
                style={{boxShadow: '0 2px 12px rgba(0,0,0,0.15)'}}
                aria-label="Прокрутить вниз"
              >
                <FaArrowDown size={24} />
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-auto">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
              type="text"
              placeholder={!dialogId ? "Ожидание начала сессии..." : "Введите сообщение..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(); }}
              disabled={loading || !dialogId || analysis}
            />
            <button
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || !dialogId || analysis}
            >
              {loading ? '...' : 'Отправить'}
            </button>
            <button
              className="bg-red-600 hover:bg-red-800 text-white font-bold px-6 py-2 rounded-lg transition disabled:opacity-50"
              onClick={handleFinish}
              disabled={loading || !dialogId || analysis}
            >
              Завершить симуляцию
            </button>
          </div>
          {isTimed && (
            <div className="mt-4 text-center text-lg text-blue-900 font-semibold">
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