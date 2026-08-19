import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7124/api",
  //baseURL: "https://api.aila.io.vn/api",
  withCredentials: true,
});

// Nhãn tiếng Việt cho tên field backend trả về trong message lỗi
const FIELD_LABELS = {
  Title: "Tiêu đề",
  Description: "Mô tả",
  VideoUrl: "Đường dẫn Video",
  Content: "Nội dung",
  DurationSeconds: "Thời lượng (giây)",
  TimeLimitMinutes: "Thời gian làm bài (phút)",
  PassingScore: "Điểm đạt (%)",
  Scenario: "Bối cảnh tình huống",
  AiTask: "Nhiệm vụ của AI",
  LearnerTask: "Nhiệm vụ của học viên",
  MaxPromptAttempts: "Số lần thử tối đa",
  OrderIndex: "Thứ tự sắp xếp",
  MaterialType: "Loại học liệu",
  ModuleId: "Học phần",
  CourseId: "Khóa học",
  QuestionType: "Loại câu hỏi",
  Answers: "Danh sách đáp án",
  Questions: "Danh sách câu hỏi",
  Weight: "Trọng số",
  PromptTemplates: "Mẫu prompt gợi ý",
  StepGuidances: "Hướng dẫn các bước",
  ScoringCriteria: "Tiêu chí đánh giá",
  FullName: "Họ và tên",
  Email: "Địa chỉ Email",
  Password: "Mật khẩu",
  Name: "Tên",
  Code: "Mã",
};

const DIRECT_ERROR_MAP = {
  "Unauthorized": "Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập.",
  "Forbidden": "Bạn không có quyền thực hiện thao tác này.",
  "Not Found": "Không tìm thấy dữ liệu yêu cầu.",
  "Internal Server Error": "Máy chủ xảy ra sự cố. Vui lòng thử lại sau.",
  "Bad Request": "Yêu cầu không hợp lệ.",
  "One or more validation errors occurred.": "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  "An error occurred while processing your request.": "Đã xảy ra lỗi trong quá trình xử lý.",
  "Invalid credentials": "Tên tài khoản hoặc mật khẩu không chính xác.",
  "User not found": "Không tìm thấy thông tin người dùng.",
  "Course not found": "Không tìm thấy khóa học.",
  "Module not found": "Không tìm thấy học phần.",
  "Material not found": "Không tìm thấy học liệu.",
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
  {
    regex: /^'(.+?)' must be greater than or equal to (\d+)\. You entered (\d+)\.$/,
    translate: (m) =>
      `${translateField(m[1])} phải lớn hơn hoặc bằng ${m[2]}. Bạn đã nhập ${m[3]}.`,
  },
  {
    regex: /^'(.+?)' is invalid\.$/,
    translate: (m) => `${translateField(m[1])} không hợp lệ.`,
  },
  {
    regex: /^Entity "(.+?)" \((.+?)\) was not found\.$/,
    translate: (m) =>
      `Không tìm thấy dữ liệu ${translateField(m[1])} (${m[2]}).`,
  },
];

function translateErrorMessage(message) {
  if (!message || typeof message !== "string") return message;
  const trimmed = message.trim();
  if (DIRECT_ERROR_MAP[trimmed]) {
    return DIRECT_ERROR_MAP[trimmed];
  }
  for (const rule of ERROR_MESSAGE_RULES) {
    const match = trimmed.match(rule.regex);
    if (match) return rule.translate(match);
  }
  return trimmed;
}
export function resolveApiError(err) {
  if (!err) return { status: 0, errorCode: null, errorMessage: null };

  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  if (!data) {
    return {
      status,
      errorCode: null,
      errorMessage: err.message || "Không thể kết nối đến máy chủ.",
    };
  }

  if (typeof data === "string") {
    return {
      status,
      errorCode: null,
      errorMessage: translateErrorMessage(data),
    };
  }

  if (typeof data === "object") {
    // 1. Check Envelope or direct error fields
    const rawMessage =
      data.errorMessage ??
      data.ErrorMessage ??
      data.message ??
      data.Message ??
      data.detail ??
      data.title ??
      data.error ??
      null;

    const errorCode = data.errorCode ?? data.ErrorCode ?? null;

    if (rawMessage) {
      return {
        status,
        errorCode,
        errorMessage: translateErrorMessage(rawMessage),
      };
    }

    // 2. Check FluentValidation / ProblemDetails errors object
    if (data.errors && typeof data.errors === "object") {
      const errorMessages = [];
      for (const key of Object.keys(data.errors)) {
        const fieldErrors = data.errors[key];
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((msg) => errorMessages.push(translateErrorMessage(msg)));
        } else if (typeof fieldErrors === "string") {
          errorMessages.push(translateErrorMessage(fieldErrors));
        }
      }
      if (errorMessages.length > 0) {
        return {
          status,
          errorCode: errorCode || "VALIDATION_ERROR",
          errorMessage: errorMessages.join("; "),
        };
      }
    }
  }

  return {
    status,
    errorCode: null,
    errorMessage: err.message || "Lỗi xử lý yêu cầu.",
  };
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
    const requestUrl = originalRequest?.url || "";

    // Không thực hiện refresh token cho các endpoint đăng nhập, đăng ký, refresh token hoặc có skipAuth
    const isAuthEndpoint =
      requestUrl.includes("/login") ||
      requestUrl.includes("/refresh") ||
      requestUrl.includes("/register") ||
      Boolean(originalRequest?.skipAuth);

    const shouldTryRefresh =
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await api.post(
        "/auth/refresh",
        {},
        { skipAuth: true }
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
  }
);

export default api;
