const CACHE_NAME = 'extravagant-style-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/icon-192x192.png',
    '/icon-512x512.png',
];

let lastOnlineStatus = navigator.onLine;

const broadcastConnectivityStatus = (isOnline) => {
    console.log('Transmitting connectivity status:', isOnline);
    if (self.clients && self.clients.matchAll) {
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'CONNECTIVITY_STATUS',
                    isOnline: isOnline,
                    timestamp: Date.now()
                });
            });
        });
    }
};

self.addEventListener('install', (event) => {
    console.log('Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Cache abierto');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activado');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            new Promise((resolve) => {
                console.log('Verificando permisos de notificación');
                console.log('Estado actual:', Notification.permission);
                resolve();
            })
        ])
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_CONNECTIVITY') {
        broadcastConnectivityStatus(navigator.onLine);
    }
});

self.addEventListener('online', () => {
    console.log('Online event triggered');
    if (lastOnlineStatus !== true) {
        lastOnlineStatus = true;
        broadcastConnectivityStatus(true);
    }
});

self.addEventListener('offline', () => {
    console.log('Offline event triggered');
    if (lastOnlineStatus !== false) {
        lastOnlineStatus = false;
        broadcastConnectivityStatus(false);
    }
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const currentOnlineStatus = navigator.onLine;
    if (currentOnlineStatus !== lastOnlineStatus) {
        lastOnlineStatus = currentOnlineStatus;
        broadcastConnectivityStatus(currentOnlineStatus);
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    if (!navigator.onLine) {
                        return caches.match(OFFLINE_URL); 
                    }
                    return new Response('Network Error', {
                        status: 503,
                        statusText: 'Network Error',
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;  
                }

                return fetch(event.request) 
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response; 
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        if (event.request.destination === 'image' ||
                            event.request.destination === 'font' ||
                            event.request.destination === 'style') {
                            return caches.match(event.request); 
                        }

                        return new Response('Network error, please check your connection.', {
                            status: 503,
                            statusText: 'Service Unavailable',
                        });
                    });
            })
    );
});

self.addEventListener('push', function(event) {
    try {
        const notificationData = event.data ? event.data.json() : {};
        console.log('Notificación recibida en el Service Worker:', notificationData);

        if (!notificationData.notification) {
            throw new Error('Datos de notificación inválidos');
        }

        // Enviar al NotificationBell
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'NOTIFICATION',
                    title: notificationData.notification.title || 'Extravagant Style',
                    message: notificationData.notification.body || 'Sin contenido',
                    timestamp: Date.now(),
                    url: notificationData.notification.data?.url || '/'
                });
            });
        });

        const options = {
            body: notificationData.notification.body || 'Sin contenido',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            image: notificationData.notification.image || null,
            vibrate: [100, 50, 100],
            data: {
                url: notificationData.notification.data?.url || '/',
                timestamp: Date.now()
            },
            actions: [
                {
                    action: 'open',
                    title: 'Ver más'
                },
                {
                    action: 'close',
                    title: 'Cerrar'
                }
            ],
            dir: 'auto',
            lang: 'es',
            renotify: true,
            requireInteraction: true,
            tag: notificationData.notification.tag || 'default',
            silent: false
        };

        event.waitUntil(
            self.registration.showNotification(
                notificationData.notification.title || 'Extravagant Style',
                options
            )
        );
    } catch (error) {
        console.error('Error al procesar notificación push:', error);
    }
});

// Limpiar notificaciones antiguas
self.addEventListener('notificationclose', function(event) {
    event.notification.close();
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notificación clickeada');
    event.notification.close();

    if (event.action === 'open') {
        const urlToOpen = event.notification.data.url || '/';
        event.waitUntil(
            clients.matchAll({type: 'window'}).then(function(clientList) {
                // Intentar encontrar una ventana ya abierta
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});


self.addEventListener('notificationclose', function(event) {
    console.log('Notificación cerrada por el usuario');
});
