import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        // Сохраняем текущий путь для редиректа после логина
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (requiredRole) {
        if (requiredRole === 'manager' && (user.role === 'manager' || user.role === 'admin')) {
            // разрешено
        } else if (user.role !== requiredRole) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default PrivateRoute; 