import api, { resolveApiError } from './api';

/**
 * Fetch all AI pricing configurations
 * UC-89: Lấy danh sách cấu hình giá
 */
export const getAIPricingConfigs = async () => {
  try {
    const res = await api.get('/admin/ai-pricing');
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Create new AI pricing configuration
 * UC-89: Tạo mới cấu hình giá
 */
export const createAIPricingConfig = async (data) => {
  try {
    const res = await api.post('/admin/ai-pricing', data);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Update AI pricing configuration
 * UC-89: Cập nhật cấu hình giá
 */
export const updateAIPricingConfig = async (id, data) => {
  try {
    const res = await api.put(`/admin/ai-pricing/${id}`, data);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};

/**
 * Delete AI pricing configuration
 * UC-89: Xóa cấu hình giá
 */
export const deleteAIPricingConfig = async (id) => {
  try {
    const res = await api.delete(`/admin/ai-pricing/${id}`);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, errorMessage };
  }
};
