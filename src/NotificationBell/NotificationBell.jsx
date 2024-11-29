import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones del localStorage al iniciar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Notification data received:', event.data);
        
        if (event.data && event.data.type === 'NOTIFICATION') {
          const newNotification = {
            id: Date.now(),
            title: event.data.title || 'Sin título',
            message: event.data.message || 'Sin mensaje',
            timestamp: new Date(event.data.timestamp || Date.now()).toISOString(),
            url: event.data.url || '/',
            read: false
          };

          setNotifications((prev) => {
            const isDuplicate = prev.some(
              (n) =>
                n.title === newNotification.title &&
                n.message === newNotification.message &&
                Date.now() - new Date(n.timestamp).getTime() < 5000
            );
            if (isDuplicate) return prev;
            return [newNotification, ...prev].slice(0, 50); // Aumentamos el límite a 50
          });
        }
      });
    }
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-purple-700 transition-colors"
      >
        <Bell size={24} color="#FFFFFF" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-gray-500 hover:text-red-500 transition-colors"
                title="Limpiar todas las notificaciones"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors relative ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 break-words flex-1">
                        {notification.title}
                      </h4>
                      <div className="flex items-center ml-2">
                        <span className="text-xs text-gray-400 whitespace-nowrap mr-2">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      {notification.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}