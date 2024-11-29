import axios from 'axios';
import connectivityHandler from './connectivity';


const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000
});

axiosInstance.interceptors.request.use(
  async config => {
    if (!navigator.onLine) {
      const pendingRequest = {
        url: config.url,
        method: config.method,
        data: config.data,
        timestamp: Date.now()
      };

      const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
      pendingRequests.push(pendingRequest);
      localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

      throw new axios.Cancel('No hay conexión a Internet');
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (!navigator.onLine || error.message === 'Network Error') {
      const cachedData = localStorage.getItem(`cache_${error.config.url}`);
      if (cachedData) {
        return Promise.resolve({ data: JSON.parse(cachedData), fromCache: true });
      }
    }
    return Promise.reject(error);
  }
);

const syncPendingRequests = async () => {
  const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
  if (pendingRequests.length === 0) return;

  for (const request of pendingRequests) {
    try {
      await axiosInstance({
        method: request.method,
        url: request.url,
        data: request.data
      });
    } catch (error) {
      console.error('Error sincronizando petición:', error);
    }
  }

  localStorage.removeItem('pendingRequests');
};

window.addEventListener('online', () => {
  connectivityHandler.showNotification('Conexión restaurada - Sincronizando datos');
  syncPendingRequests();
});

window.addEventListener('offline', () => {
  connectivityHandler.showNotification('Sin conexión - Modo offline activado');
});

export default axiosInstance;