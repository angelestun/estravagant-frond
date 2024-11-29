// src/components/NotificationComponent/NotificationComponent.jsx
import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationComponent.css';

const NotificationComponent = () => {
    const { isSubscribed, isLoading, subscribe, unsubscribe } = useNotifications();
    const userRole = localStorage.getItem('userRole');

    const getNotificationMessage = () => {
        switch(userRole) {
            case 'vendedor':
                return 'Recibe notificaciones sobre pedidos, stock y ventas';
            case 'admin':
                return 'Recibe notificaciones sobre nuevas tiendas y cupones';
            default:
                return 'Recibe notificaciones sobre ofertas y nuevos productos';
        }
    };

    return (
        <div className="notification-container">
            <p className="notification-message">{getNotificationMessage()}</p>
            <button 
                className={`notification-button ${isSubscribed ? 'active' : ''}`}
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
            >
                {isLoading ? 'Procesando...' : 
                 isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
            </button>
        </div>
    );
};

export default NotificationComponent;