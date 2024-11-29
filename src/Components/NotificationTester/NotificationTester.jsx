import React, { useState, useEffect } from 'react';
import { subscribeToPushNotifications, checkSubscriptionStatus } from '../../services/pushNotifications';

const NotificationTester = () => {
    const [status, setStatus] = useState('checking');
    const [lastMessage, setLastMessage] = useState('');

    useEffect(() => {
        checkCurrentStatus();
    }, []);

    const checkCurrentStatus = async () => {
        try {
            const isSubscribed = await checkSubscriptionStatus();
            setStatus(isSubscribed ? 'subscribed' : 'unsubscribed');
        } catch (error) {
            setStatus('error');
            setLastMessage(error.message);
        }
    };

    const handleSubscribe = async () => {
        try {
            setStatus('subscribing');
            await subscribeToPushNotifications();
            setStatus('subscribed');
            setLastMessage('Suscripción exitosa');
        } catch (error) {
            setStatus('error');
            setLastMessage(error.message);
        }
    };

    const handleTestNotification = async () => {
        try {
            const response = await fetch('http://localhost:3000/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('userId')
                })
            });

            if (!response.ok) {
                throw new Error('Error al enviar notificación de prueba');
            }

            setLastMessage('Notificación de prueba enviada');
        } catch (error) {
            setLastMessage('Error: ' + error.message);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Prueba de Notificaciones</h2>
            
            <div className="mb-4">
                <p>Estado actual: 
                    <span className={`ml-2 px-2 py-1 rounded ${
                        status === 'subscribed' ? 'bg-green-100 text-green-800' :
                        status === 'unsubscribed' ? 'bg-yellow-100 text-yellow-800' :
                        status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {status === 'subscribed' ? 'Suscrito' :
                         status === 'unsubscribed' ? 'No suscrito' :
                         status === 'subscribing' ? 'Suscribiendo...' :
                         status === 'error' ? 'Error' :
                         'Verificando...'}
                    </span>
                </p>
            </div>

            <div className="space-x-4">
                <button
                    onClick={handleSubscribe}
                    disabled={status === 'subscribing' || status === 'subscribed'}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {status === 'subscribing' ? 'Suscribiendo...' : 'Suscribirse'}
                </button>

                <button
                    onClick={handleTestNotification}
                    disabled={status !== 'subscribed'}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                    Enviar notificación de prueba
                </button>
            </div>

            {lastMessage && (
                <div className="mt-4 p-2 bg-gray-100 rounded">
                    <p>{lastMessage}</p>
                </div>
            )}

            <div className="mt-4">
                <h3 className="font-bold mb-2">Estado del sistema:</h3>
                <ul className="list-disc pl-5">
                    <li>Service Worker: {navigator.serviceWorker ? '✅' : '❌'}</li>
                    <li>Push API: {'PushManager' in window ? '✅' : '❌'}</li>
                    <li>Notifications: {'Notification' in window ? '✅' : '❌'}</li>
                    <li>Permisos: {Notification.permission}</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationTester;