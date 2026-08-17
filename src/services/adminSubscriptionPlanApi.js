import api from '@services/api';

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
 * CHỈ 7 trường: description, price, durationInDays, aiTokenLimit,
 * aiPracticeScenarioLimit, expertEvaluationLimit, displayOrder.
 * name/tierLevel bất biến (INV-01, BR-01) nên BE bỏ qua; durationInDays thì KHÔNG —
 * BE bắt buộc > 0, thiếu trường này request sẽ fail.
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

/** GET /api/admin/subscription-plans/statistics — Thống kê người mua & doanh thu cho admin. */
export async function getAdminSubscriptionStatistics({ fromDate, toDate } = {}) {
  const params = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get('/admin/subscription-plans/statistics', { params });
  return res.data;
}

