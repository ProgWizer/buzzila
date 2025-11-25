import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Компоненты страниц
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import Manager from './pages/ModeratorPanel';
import Scenarios from './pages/Scenarios';
import Chat from './pages/Chat';
import YandexCallback from './components/YandexCallback';

// Общие компоненты
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Защищённые маршруты */}
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute requiredRole="admin">
                      <Admin />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/manager"
                  element={
                    <PrivateRoute requiredRole="manager">
                      <Manager />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route path="/auth/yandex/callback" element={<YandexCallback />} />
                <Route
                  path="/achievements"
                  element={
                    <PrivateRoute>
                      <Achievements />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/scenarios"
                  element={
                    <PrivateRoute>
                      <Scenarios />
                    </PrivateRoute>
                  }
                />
                <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />

                {/* Редирект для неизвестных маршрутов */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <ThemeToggle />
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 