import axios from "axios";

const api = axios.create({
   baseURL: "https://localhost:7124/api",
  // baseURL: "https://api.aila.io.vn/api",
  withCredentials: true,
});

// Nhãn tiếng Việt cho tên field backend trả về trong message lỗi
const FIELD_LABELS = {
  Title: "Tiêu đề",
  Description: "Mô tả",
  VideoUrl: "Đường dẫn Video",
  Content: "Nội dung",
  DurationSeconds: "Thời lượng",
  TimeLimitMinutes: "Thời gian làm bài",
  PassingScore: "Điểm đạt",
  Scenario: "Bối cảnh",
  AiTask: "Nhiệm vụ của AI",
  LearnerTask: "Nhiệm vụ của học viên",
  MaxPromptAttempts: "Số lần thử tối đa",
};

function translateField(field) {
  return FIELD_LABELS[field] || field;
}

// Các mẫu message quen thuộc do FluentValidation sinh ra
const ERROR_MESSAGE_RULES = [
  {
    regex:
      /^The length of '(.+?)' must be at least (\d+) characters?\. You entered (\d+) characters?\.$/,
    translate: (m) =>
      `${translateField(m[1])} phải có ít nhất ${m[2]} ký tự. Bạn đã nhập ${m[3]} ký tự.`,
  },
  {
    regex:
      /^The length of '(.+?)' must be (\d+) characters? or fewer\. You entered (\d+) characters?\.$/,
    translate: (m) =>
      `${translateField(m[1])} không được dài quá ${m[2]} ký tự. Bạn đã nhập ${m[3]} ký tự.`,
  },
  {
    regex: /^'(.+?)' must not be empty\.$/,
    translate: (m) => `${translateField(m[1])} không được để trống.`,
  },
  {
    regex: /^'(.+?)' is not a valid email address\.$/,
    translate: (m) => `${translateField(m[1])} không đúng định dạng email.`,
  },
  {
    regex: /^'(.+?)' must be between (\d+) and (\d+)\. You entered (\d+)\.$/,
    translate: (m) =>
      `${translateField(m[1])} phải nằm trong khoảng từ ${m[2]} đến ${m[3]}. Bạn đã nhập ${m[4]}.`,
  },
  {
    regex: /^'(.+?)' must be greater than '?(.+?)'?\.$/,
    translate: (m) =>
      `${translateField(m[1])} phải lớn hơn ${translateField(m[2])}.`,
  },
];

function translateErrorMessage(message) {
  if (!message || typeof message !== "string") return message;
  for (const rule of ERROR_MESSAGE_RULES) {
    const match = message.match(rule.regex);
    if (match) return rule.translate(match);
  }
  return message; // không khớp mẫu nào -> giữ nguyên, không mất thông tin
}
export function resolveApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  const hasEnvelope =
    data &&
    typeof data === "object" &&
    ("success" in data || "Success" in data);

  if (hasEnvelope) {
    const rawMessage = data.errorMessage ?? data.ErrorMessage ?? null;
    return {
      status,
      errorCode: data.errorCode ?? data.ErrorCode ?? null,
      errorMessage: translateErrorMessage(rawMessage),
    };
  }

  return { status, errorCode: null, errorMessage: null };
}

export function normalizeApiResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return { success: false, data: null, errorMessage: null, errorCode: null };
  }
  return {
    success: payload.success ?? payload.Success ?? false,
    data: payload.data ?? payload.Data ?? null,
    errorMessage: payload.errorMessage ?? payload.ErrorMessage ?? null,
    errorCode: payload.errorCode ?? payload.ErrorCode ?? null,
  };
}

function clearAuthSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("adminLoggedIn");
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const shouldTryRefresh =
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.skipAuth;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await api.post(
        "/auth/refresh",
        {},
        { skipAuth: true },
      );
      const newAccessToken = refreshResponse?.data?.data?.accessToken;

      if (!newAccessToken) {
        clearAuthSession();
        return Promise.reject(error);
      }

      localStorage.setItem("accessToken", newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthSession();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
