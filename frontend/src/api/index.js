import axios from 'axios';

const API = axios.create({
  // In dev/prod we support hitting backend proxy or absolute env-level path
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

// Request interceptor to inject active JWT access tokens into request headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to intercept unauthenticated requests and perform silent JWT refreshes
API.interceptors.response.use(
  (response) => {
    // Return standard body payload directly for easy UI queries
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If request fails due to token expiry, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Standard absolute endpoint refresh query
          const res = await axios.post(`${API.defaults.baseURL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const newToken = res.data.data.access_token;
          localStorage.setItem('token', newToken);
          
          // Re-attempt original request with updated authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh token fails (e.g. expired or invalid), clear credentials and eject to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Extract formatted APIException payload error or fallback to standard message
    const errMsg = error.response?.data?.message || 'A network error occurred. Please check your connection.';
    return Promise.reject(new Error(errMsg));
  }
);

export default API;
