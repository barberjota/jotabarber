import axios from 'axios';

let rawApiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
if (rawApiUrl && !rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = rawApiUrl.endsWith('/') ? `${rawApiUrl}api` : `${rawApiUrl}/api`;
}
const API_URL = rawApiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales (como 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token es inválido o expirado, lo limpiamos y recargamos
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // No redirigimos con window.location directamente para evitar loops en rutas públicas,
      // pero limpiamos el estado.
    }
    return Promise.reject(error);
  }
);

export default api;
