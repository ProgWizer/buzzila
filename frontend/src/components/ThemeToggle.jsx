import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 p-3 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 shadow-lg transition-all duration-200 z-50"
      aria-label="Toggle theme"
      style={{ minWidth: 44, minHeight: 44 }}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-7 w-7 sm:h-6 sm:w-6 text-yellow-500 transition-all" />
      ) : (
        <MoonIcon className="h-7 w-7 sm:h-6 sm:w-6 text-gray-700 transition-all" />
      )}
    </button>
  );
};

export default ThemeToggle; 