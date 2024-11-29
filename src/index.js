import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register'; 
import { ConnectivityProvider } from './context/useConnectivity';

const registerServiceWorker = async () => {
  try {
    const updateSW = registerSW({
      immediate: true,  
      logger: false,   
      devOptions: { 
        enabled: true,  
        suppressWarnings: true, 
      },
      onNeedRefresh() {
        updateSW?.();
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('connectivity-ready'));
      },
      onRegistered(swRegistration) {
        if (swRegistration) {
          swRegistration.addEventListener('message', (event) => {
            if (event.data?.type === 'CONNECTIVITY_STATUS') {
              window.dispatchEvent(
                new CustomEvent('connectivity-change', { 
                  detail: event.data 
                })
              );
            }
          });
        }
      },
      onRegisterError(error) {
        throw error;
      },
    });
  } catch (error) {
    const retryCount = (window._swRetryCount || 0) + 1;
    window._swRetryCount = retryCount;
    
    if (retryCount <= 3) {
      const timeout = Math.min(1000 * Math.pow(2, retryCount), 5000); 
      setTimeout(registerServiceWorker, timeout);
    }
  }
};

registerServiceWorker(); 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConnectivityProvider>
      <App />
    </ConnectivityProvider>
  </React.StrictMode>
);
