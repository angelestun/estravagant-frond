import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import '../styles/connectivity.css';

export const ConnectivityContext = createContext({
    isOnline: true,
    showNotification: () => {},
});

export function useConnectivity() {
    const context = useContext(ConnectivityContext);

    if (!context) {
        console.warn('ConnectivityProvider no está disponible');
        return {
            isOnline: navigator.onLine,  
            showNotification: () => {},
        };
    }

    return context;
}

export const ConnectivityProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((title, message, type = 'info') => {
        if (!title || !message) return;
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    useEffect(() => {
        const handleConnectivityMessage = (event) => {
            if (!event.data) return;
            
            try {
                const { type, isOnline: swIsOnline } = event.data;
                
                if (type === 'CONNECTIVITY_STATUS') {
                    setIsOnline(swIsOnline);
                    showNotification(
                        swIsOnline ? 'Conexión Restaurada' : 'Sin Conexión',
                        swIsOnline 
                            ? 'Tu conexión a internet ha sido restaurada'
                            : 'No hay conexión a internet. Modo offline activado',
                        swIsOnline ? 'success' : 'warning'
                    );
                }
            } catch (error) {
                console.error('Error al procesar mensaje de conectividad:', error);
            }
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleConnectivityMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleConnectivityMessage);
            };
        }
    }, [showNotification]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showNotification(
                'Conexión Restaurada',
                'Tu conexión a internet ha sido restaurada',
                'success'
            );
            
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CONNECTIVITY_STATUS',
                    isOnline: true
                });
            }
        };
    
        const handleOffline = () => {
            setIsOnline(false);
            showNotification(
                'Sin Conexión',
                'No hay conexión a internet. Modo offline activado',
                'warning'
            );
            
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CONNECTIVITY_STATUS',
                    isOnline: false
                });
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showNotification]);

    const contextValue = {
        isOnline,
        showNotification
    };

    return (
        <ConnectivityContext.Provider value={contextValue}>
            {children}
            <div className="notifications-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification notification-${notification.type}`}
                    >
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                    </div>
                ))}
            </div>
        </ConnectivityContext.Provider>
    );
};

export default ConnectivityProvider;