import api, { resolveApiError } from './api';

/**
 * UC-87: Báo cáo tiêu thụ tài nguyên AI
 * BE trả ResponseDto<AIResourceConsumptionReportDto>
 */
export const getAIResourceConsumptionReport = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get('/admin/ai-reports/resource-consumption', { params });
    // res.data = ResponseDto { success, data, errorCode, errorMessage }
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải báo cáo tiêu thụ.' };
  }
};

/**
 * UC-87: Xu hướng tiêu thụ theo thời gian
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
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải xu hướng tiêu thụ.' };
  }
};

/**
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
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải phân tích dịch vụ.' };
  }
};

/**
 * UC-87: Top người dùng tiêu tốn nhiều token nhất
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
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải top người tiêu thụ.' };
  }
};

/**
 * UC-88: Vi phạm chính sách AI
 */
export const getAIPolicyViolations = async (violationType, pageNumber = 1, pageSize = 20) => {
  try {
    const params = { pageNumber, pageSize };
    if (violationType) params.violationType = violationType;

    const res = await api.get('/admin/ai-reports/policy-violations', { params });
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải danh sách vi phạm.' };
  }
};
