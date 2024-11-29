self.workbox = {
    debug: false,
    logger: {
      debug: () => {},
      log: () => {},
      warn: () => {},
      error: () => {},
      groupCollapsed: () => {},
      groupEnd: () => {}
    }
  };
  
  let isOnline = true;
  
  const notifyConnectivityChange = (online) => {
    if (isOnline !== online) {
      isOnline = online;
      
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CONNECTIVITY_STATUS',
            isOnline,
            timestamp: Date.now()
          });
        });
      });
    }
  };
  
  self.addEventListener('fetch', event => {
    const request = event.request;
    
    if (request.url.includes('/api/') || request.url.includes('localhost:3000')) {
      event.respondWith(
        fetch(request)
          .then(response => {
            notifyConnectivityChange(true);
            return response;
          })
          .catch(error => {
            notifyConnectivityChange(false);
            throw error;
          })
      );
    }
  });
  
  setInterval(() => {
    fetch('/ping')
      .then(() => notifyConnectivityChange(true))
      .catch(() => notifyConnectivityChange(false));
  }, 30000);
  
  self.addEventListener('message', event => {
    if (event.data?.type === 'CHECK_CONNECTIVITY') {
      fetch('/ping')
        .then(() => notifyConnectivityChange(true))
        .catch(() => notifyConnectivityChange(false));
    }
  });