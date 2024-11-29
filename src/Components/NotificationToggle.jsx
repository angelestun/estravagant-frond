import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

function NotificationToggle() {
    const { isSubscribed, isLoading, subscribe, unsubscribe } = useNotifications();
    const userId = localStorage.getItem('userId');

    return (
        <div className="notification-toggle">
            <h3>Notificaciones Push</h3>
            <button 
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading || !userId}
                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
            >
                {isLoading ? 'Procesando...' : 
                 isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
            </button>
        </div>
    );
}

export default NotificationToggle;