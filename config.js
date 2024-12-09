const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://extravagant-back-1.onrender.com'  // URL de tu backend en Render
  : 'http://localhost:3000';  // URL para desarrollo local

export default API_URL;