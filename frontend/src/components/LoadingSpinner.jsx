import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            <span className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-600 dark:text-gray-300 animate-pulse">Загрузка...</span>
        </div>
    );
};

export default LoadingSpinner; 