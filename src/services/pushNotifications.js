
import axios from 'axios';

const urlB64ToUint8Array = (base64String) => {
    try {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    } catch (error) {
        console.error('Error al convertir clave VAPID:', error);
        throw new Error('Error al procesar la clave VAPID');
    }
};

const VAPID_PUBLIC_KEY = 'BL8TL4HNOLqhA819AaYm7ifoluzHeabMLZtQjHnkpz_j95PxnTub_0u8lp2pG4vFXXIO01Uf6dTuXuFIjR-ctVM';


const checkPushSupport = () => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers no soportados');
    }
    if (!('PushManager' in window)) {
        throw new Error('Push API no soportada');
    }
    if (!('Notification' in window)) {
        throw new Error('Notificaciones no soportadas');
    }
};

const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permiso de notificaciones denegado');
        }
        return permission;
    } catch (error) {
        console.error('Error al solicitar permisos:', error);
        throw error;
    }
};

const registerServiceWorker = async () => {
    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });
        
        await navigator.serviceWorker.ready;
        console.log('Service Worker registrado y activo:', registration);
        return registration;
    } catch (error) {
        console.error('Error al registrar Service Worker:', error);
        throw new Error('Error al registrar Service Worker');
    }
};

const checkExistingSubscription = async (registration) => {
    try {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            console.log('Suscripción existente encontrada:', subscription.endpoint);
            return subscription;
        }
        return null;
    } catch (error) {
        console.error('Error al verificar suscripción existente:', error);
        return null;
    }
};

const subscribeToPushNotifications = async () => {
    try {
        checkPushSupport();

        await requestNotificationPermission();

        const registration = await registerServiceWorker();
        
        const existingSubscription = await checkExistingSubscription(registration);
        if (existingSubscription) {
            console.log('Usando suscripción existente');
            const userId = localStorage.getItem('userId');
            if (!userId) {
                throw new Error('Usuario no identificado');
            }

            const response = await axios.post('http://localhost:3000/subscribe', {
                subscription: existingSubscription.toJSON(),
                userId: userId
            });

            if (response.status === 201) {
                localStorage.setItem('pushNotificationsEnabled', 'true');
                console.log('Suscripción existente actualizada en el servidor');
                return true;
            }
        }
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegistrations) {
            await reg.unregister();
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const newRegistration = await registerServiceWorker();
        
        if (newRegistration.installing) {
            await new Promise(resolve => {
                newRegistration.installing.addEventListener('statechange', (e) => {
                    if (e.target.state === 'activated') {
                        resolve();
                    }
                });
            });
        }

        const subscription = await newRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array('BL8TL4HNOLqhA819AaYm7ifoluzHeabMLZtQjHnkpz_j95PxnTub_0u8lp2pG4vFXXIO01Uf6dTuXuFIjR-ctVM')
        });

        console.log('Nueva suscripción creada:', subscription);

        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('Usuario no identificado');
        }

        const response = await axios.post('http://localhost:3000/subscribe', {
            subscription: subscription.toJSON(),
            userId: userId
        });

        if (response.status === 201) {
            localStorage.setItem('pushNotificationsEnabled', 'true');
            console.log('Nueva suscripción registrada exitosamente');
            window.location.reload();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error en suscripción:', error);
        localStorage.removeItem('pushNotificationsEnabled');
        throw error;
    }
};

const unsubscribeFromPushNotifications = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
        }

        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }

        localStorage.removeItem('pushNotificationsEnabled');
        console.log('Desuscripción completada');

        return true;
    } catch (error) {
        console.error('Error al desuscribirse:', error);
        throw error;
    }
};


const checkAndUpdateServiceWorker = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return true;
    } catch (error) {
        console.error('Error al actualizar service worker:', error);
        return false;
    }
};

const checkSubscriptionStatus = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return {
            isSubscribed: !!subscription,
            subscription: subscription
        };
    } catch (error) {
        console.error('Error al verificar estado de suscripción:', error);
        return {
            isSubscribed: false,
            subscription: null
        };
    }
};

export {
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    checkAndUpdateServiceWorker,
    checkSubscriptionStatus
};