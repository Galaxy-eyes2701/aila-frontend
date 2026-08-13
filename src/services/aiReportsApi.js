import api, { resolveApiError } from './api';

/**
 * Fetch AI resource consumption report
 * UC-87: Lấy báo cáo tiêu thụ tài nguyên AI
 */
export const getAIResourceConsumptionReport = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get('/admin/ai-reports/resource-consumption', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Fetch AI consumption trend data
 * UC-87: Dashboard analytics - dữ liệu vẽ biểu đồ xu hướng
 */
export const getAIConsumptionTrend = async (startDate, endDate, interval = 'day') => {
  try {
    const params = { interval };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get('/admin/ai-reports/consumption-trend', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Fetch AI service breakdown
 * UC-87: Cơ cấu tỷ trọng chi phí theo dịch vụ
 */
export const getAIServiceBreakdown = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get('/admin/ai-reports/breakdown-by-service', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Fetch top consumers
 * UC-87: Top người dùng và top bài học tiêu tốn nhiều token
 */
export const getAITopConsumers = async (startDate, endDate, top = 5) => {
  try {
    const params = { top };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get('/admin/ai-reports/top-consumers', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Fetch AI policy violations
 * UC-88: Giám sát vi phạm chính sách & an toàn nội dung AI
 */
export const getAIPolicyViolations = async (violationType, pageNumber = 1, pageSize = 20) => {
  try {
    const params = { pageNumber, pageSize };
    if (violationType) params.violationType = violationType;

    const res = await api.get('/admin/ai-reports/policy-violations', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};
