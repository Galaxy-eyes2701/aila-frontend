import api from '../../../../utils/api';

/** GET /api/subscription-plans — công khai, không cần token. BE đã lọc Active + sắp xếp sẵn. */
export async function getPublicSubscriptionPlans() {
  const res = await api.get('/subscription-plans');
  return res.data;
}

/**
 * GET /api/subscription-plans/{planId} — bước re-check bắt buộc trước khi sang trang mua.
 * ⚠️ Không được cache kết quả của endpoint này.
 */
export async function getPublicSubscriptionPlanById(planId) {
  const res = await api.get(`/subscription-plans/${planId}`);
  return res.data;
}
