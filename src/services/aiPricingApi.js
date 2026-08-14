import api, { resolveApiError } from './api';

/**
 * UC-89: Lấy danh sách cấu hình giá AI
 * BE trả ResponseDto<AIPricingListResponseDto>
 */
export const getAIPricingConfigs = async () => {
  try {
    const res = await api.get('/admin/ai-pricing');
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tải cấu hình giá.' };
  }
};

/**
 * UC-89: Tạo mới cấu hình giá
 * BE trả ResponseDto<AIPricingConfigDto>
 */
export const createAIPricingConfig = async (data) => {
  try {
    const res = await api.post('/admin/ai-pricing', data);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể tạo cấu hình giá.' };
  }
};

/**
 * UC-89: Cập nhật cấu hình giá
 * BE trả ResponseDto<AIPricingConfigDto>
 */
export const updateAIPricingConfig = async (id, data) => {
  try {
    const res = await api.put(`/admin/ai-pricing/${id}`, data);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể cập nhật cấu hình giá.' };
  }
};

/**
 * UC-89: Xóa cấu hình giá
 * BE trả ResponseDto<bool>
 */
export const deleteAIPricingConfig = async (id) => {
  try {
    const res = await api.delete(`/admin/ai-pricing/${id}`);
    return res.data;
  } catch (err) {
    const { errorMessage } = resolveApiError(err);
    return { success: false, data: null, errorMessage: errorMessage || 'Không thể xóa cấu hình giá.' };
  }
};
