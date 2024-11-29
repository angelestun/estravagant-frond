import React from 'react';
import useNotificationStore from '../services/NotificationService';
import '../styles/connectivity.css'; 

function NotificationContainer() {
  const notifications = useNotificationStore((state) => state.notifications);

  return (
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
  );
}

export default NotificationContainer;