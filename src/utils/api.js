import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7124/api',
});

/**
 * Chuẩn hóa lỗi axios về envelope của backend.
 * Dùng khi cần phân nhánh theo errorCode/HTTP status trong catch block.
 */
export function resolveApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  if (data && typeof data === 'object' && 'success' in data) {
    return {
      status,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
    };
  }

  // Ngoài envelope: ValidationProblemDetails của .NET, 5xx hoặc lỗi mạng
  return { status, errorCode: null, errorMessage: null };
}

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
