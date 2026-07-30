import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7124/api',
});

export function resolveApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  const hasEnvelope =
    data && typeof data === 'object' && ('success' in data || 'Success' in data);

  if (hasEnvelope) {
    return {
      status,
      errorCode: data.errorCode ?? data.ErrorCode ?? null,
      errorMessage: data.errorMessage ?? data.ErrorMessage ?? null,
    };
  }

  return { status, errorCode: null, errorMessage: null };
}

export function normalizeApiResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, data: null, errorMessage: null, errorCode: null };
  }
  return {
    success: payload.success ?? payload.Success ?? false,
    data: payload.data ?? payload.Data ?? null,
    errorMessage: payload.errorMessage ?? payload.ErrorMessage ?? null,
    errorCode: payload.errorCode ?? payload.ErrorCode ?? null,
  };
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
