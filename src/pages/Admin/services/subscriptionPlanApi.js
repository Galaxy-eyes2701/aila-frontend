import api from '../../../utils/api';

/** GET /api/admin/subscription-plans — gồm cả gói Inactive, đã sắp xếp sẵn. */
export async function getAdminSubscriptionPlans() {
  const res = await api.get('/admin/subscription-plans');
  return res.data;
}

/** POST /api/admin/subscription-plans (UC-90) — gói mới luôn ở trạng thái Active, không gửi `status`. */
export async function createSubscriptionPlan(payload) {
  const res = await api.post('/admin/subscription-plans', payload);
  return res.data;
}

/**
 * PUT /api/admin/subscription-plans/{planId} (UC-91).
 * CHỈ 6 trường: description, price, aiTokenLimit, aiPracticeScenarioLimit,
 * expertEvaluationLimit, displayOrder. name/tierLevel/durationInDays bị BE bỏ qua.
 */
export async function updateSubscriptionPlan(planId, payload) {
  const res = await api.put(`/admin/subscription-plans/${planId}`, payload);
  return res.data;
}

/** PATCH /api/admin/subscription-plans/{planId}/status (UC-92). */
export async function changeSubscriptionPlanStatus(planId, isActive) {
  const res = await api.patch(`/admin/subscription-plans/${planId}/status`, { isActive });
  return res.data;
}
