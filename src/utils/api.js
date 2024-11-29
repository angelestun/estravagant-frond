import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

api.interceptors.response.use(null, async error => {
  const config = error.config;
  
  if (!config || !config.retry) {
    return Promise.reject(error);
  }
  
  config.__retryCount = config.__retryCount || 0;
  
  if (config.__retryCount >= config.retry) {
    return Promise.reject(error);
  }
  
  config.__retryCount += 1;
  await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1));
  
  return api(config);
});

export default api;