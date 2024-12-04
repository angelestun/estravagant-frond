const CACHE_NAME = 'extravagant-style-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/favicon.ico'

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

// En el fetch event handler



self.addEventListener('navigationpreload', (event) => {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
  });
  

self.addEventListener('fetch', (event) => {
    if (event.request.method === 'HEAD' && event.request.url.includes('extravagant-style.vercel.app')) {
        event.respondWith(
            new Response(null, {
                status: 200,
                statusText: 'OK'
            })
        );
        return;
    }
    
    const currentOnlineStatus = navigator.onLine;
    if (currentOnlineStatus !== lastOnlineStatus) {
        lastOnlineStatus = currentOnlineStatus;
        broadcastConnectivityStatus(currentOnlineStatus);
    }

    // Manejar las peticiones de API de manera diferente
    if (event.request.url.includes('extravagant-back.vercel.app')) {
        event.respondWith(
            fetch(event.request)
                .then(response => response)
                .catch(error => {
                    console.error('Error en petición API:', error);
                    return new Response(JSON.stringify({ error: 'Error de red' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // Para navegación SPA
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    if (!navigator.onLine) {
                        return caches.match(OFFLINE_URL);
                    }
                    // Si la ruta no existe, redirigir al index.html
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // Para otros recursos
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
                        return new Response('Error de red, por favor verifica tu conexión.', {
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
        
        const options = {
            ...notificationData.notification,
            icon: '/android-chrome-192x192.png',  // Actualizado para coincidir con manifest
            badge: '/android-chrome-192x192.png',  // Actualizado para coincidir con manifest
            data: {
                url: notificationData.notification.data?.url || '/',
                ...notificationData.notification.data
            },
            requireInteraction: true,
            vibrate: [100, 50, 100]
        };

        event.waitUntil(
            self.registration.showNotification(
                notificationData.notification.title,
                options
            )
        );
    } catch (error) {
        console.error('Error procesando push:', error);
    }
});

// Limpiar notificaciones antiguas
self.addEventListener('notificationclose', function(event) {
    event.notification.close();
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notificación clickeada');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(function(clientList) {
            // Intentar encontrar una ventana ya abierta
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventana abierta, abrir una nueva
            return clients.openWindow(urlToOpen);
        })
        .catch(error => {
            console.error('Error al manejar click en notificación:', error);
        })
    );
});



self.addEventListener('notificationclose', function(event) {
    console.log('Notificación cerrada por el usuario');
});
