// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const useNotifications = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setIsLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error al verificar suscripción:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const subscribe = async () => {
        try {
            setIsLoading(true);
            const registration = await navigator.serviceWorker.ready;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(
                    'BL8TL4HNOLqhA819AaYm7ifoluzHeabMLZtQjHnkpz_j95PxnTub_0u8lp2pG4vFXXIO01Uf6dTuXuFIjR-ctVM'
                )
            });

            await axios.post('http://localhost:3000/subscribe', {
                subscription,
                userId
            });

            setIsSubscribed(true);
        } catch (error) {
            console.error('Error al suscribirse:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        try {
            setIsLoading(true);
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                await axios.delete('http://localhost:3000/unsubscribe', {
                    data: {
                        endpoint: subscription.endpoint,
                        userId
                    }
                });
            }
            
            setIsSubscribed(false);
        } catch (error) {
            console.error('Error al cancelar suscripción:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe
    };
};