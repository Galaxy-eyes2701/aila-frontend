/**
 * Thứ tự hiển thị (displayOrder) không còn nhập tay trong form:
 * - Tạo gói: FE tự gán displayOrder kế tiếp.
 * - Đổi thứ tự: dùng nút mũi tên ở bảng, ghi lại qua PUT từng gói.
 *
 * BE chưa có endpoint reorder riêng cho subscription plan (khác /admin/categories/reorder),
 * nên phải PUT lần lượt các gói có displayOrder thay đổi.
 */

const toOrder = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/** displayOrder cho gói mới = lớn nhất hiện có + 1 (danh sách rỗng → 1). */
export function nextDisplayOrder(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return 1;
  return Math.max(...plans.map((plan) => toOrder(plan.displayOrder))) + 1;
}

/** Trả về mảng mới sau khi chuyển phần tử ở `index` lên/xuống một bậc. */
export function movePlan(plans, index, direction) {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= plans.length) return null;

  const next = [...plans];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Ghép thứ tự mới vào danh sách đã sắp xếp lại và chỉ giữ các gói THỰC SỰ đổi số.
 * Tái sử dụng đúng tập giá trị displayOrder đang có (nếu tăng dần nghiêm ngặt) để một lần
 * đổi chỗ liền kề chỉ tốn 2 request; nếu dữ liệu cũ bị trùng/lệch thì đánh số lại 1..N.
 */
export function buildReorderUpdates(currentPlans, nextPlans) {
  const values = currentPlans.map((plan) => toOrder(plan.displayOrder)).sort((a, b) => a - b);
  const strictlyIncreasing = values.every((value, i) => i === 0 || value > values[i - 1]);
  const targets = strictlyIncreasing ? values : nextPlans.map((_, i) => i + 1);

  return nextPlans
    .map((plan, i) => ({ plan, displayOrder: targets[i] }))
    .filter(({ plan, displayOrder }) => toOrder(plan.displayOrder) !== displayOrder);
}

/** PUT /admin/subscription-plans/{id} luôn cần đủ 7 trường — giữ nguyên 6 trường còn lại. */
export function buildOrderUpdatePayload(plan, displayOrder) {
  return {
    description: plan.description ?? null,
    price: Number(plan.price),
    // BE validate durationInDays > 0; thiếu trường này JSON bind về 0 → INVALID_PLAN_DURATION.
    durationInDays: Number(plan.durationInDays),
    aiTokenLimit: Number(plan.aiTokenLimit),
    aiPracticeScenarioLimit: Number(plan.aiPracticeScenarioLimit),
    expertEvaluationLimit: Number(plan.expertEvaluationLimit),
    displayOrder,
  };
}
