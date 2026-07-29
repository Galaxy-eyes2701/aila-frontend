import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7124/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  config.headers = config.headers || {};
  // Endpoint public (vd. luồng reset password) truyền { skipAuth: true } để không gửi token.
  if (config.skipAuth) {
    delete config.headers.Authorization;
    return config;
  }
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default api;
