import { INT32_MAX, PRICE_MAX_INTEGER_DIGITS } from '../../../utils/subscriptionPlan';

/**
 * Mirror client-side của rule validation phía server (§0.4).
 * Backend fail-fast (chỉ trả lỗi ĐẦU TIÊN) nên FE phải validate đủ và hiện mọi lỗi cùng lúc.
 */

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

const INT_OVERFLOW_MESSAGE = `Giá trị không được vượt quá ${INT32_MAX.toLocaleString('vi-VN')}.`;

/** errorCode → field để gắn lỗi inline (§0.6). */
export const FIELD_BY_ERROR_CODE = {
  PLAN_NAME_REQUIRED: 'name',
  PLAN_NAME_TOO_LONG: 'name',
  PLAN_NAME_ALREADY_EXISTS: 'name',
  PLAN_DESCRIPTION_TOO_LONG: 'description',
  INVALID_PLAN_PRICE: 'price',
  INVALID_TIER_LEVEL: 'tierLevel',
  TIER_LEVEL_ALREADY_EXISTS: 'tierLevel',
  INVALID_PLAN_DURATION: 'durationInDays',
  INVALID_AI_TOKEN_LIMIT: 'aiTokenLimit',
  INVALID_AI_PRACTICE_SCENARIO_LIMIT: 'aiPracticeScenarioLimit',
  INVALID_EXPERT_EVALUATION_LIMIT: 'expertEvaluationLimit',
  INVALID_DISPLAY_ORDER: 'displayOrder',
};

export const emptyPlanForm = {
  name: '',
  description: '',
  price: '',
  tierLevel: '',
  durationInDays: '',
  aiTokenLimit: '',
  aiPracticeScenarioLimit: '',
  expertEvaluationLimit: '',
  displayOrder: '',
};

/** Thứ tự field trong form — dùng để focus vào ô lỗi đầu tiên. */
export const CREATE_FIELD_ORDER = [
  'name',
  'description',
  'price',
  'tierLevel',
  'durationInDays',
  'aiTokenLimit',
  'aiPracticeScenarioLimit',
  'expertEvaluationLimit',
  'displayOrder',
];

/** UC-91 chỉ sửa được 6 trường; name/tierLevel/durationInDays bất biến (§5.1). */
export const EDIT_FIELD_ORDER = [
  'description',
  'price',
  'aiTokenLimit',
  'aiPracticeScenarioLimit',
  'expertEvaluationLimit',
  'displayOrder',
];

export function planToForm(plan) {
  if (!plan) return { ...emptyPlanForm };

  return {
    name: plan.name ?? '',
    description: plan.description ?? '',
    price: plan.price ?? '',
    tierLevel: plan.tierLevel ?? '',
    durationInDays: plan.durationInDays ?? '',
    aiTokenLimit: plan.aiTokenLimit ?? '',
    aiPracticeScenarioLimit: plan.aiPracticeScenarioLimit ?? '',
    expertEvaluationLimit: plan.expertEvaluationLimit ?? '',
    displayOrder: plan.displayOrder ?? '',
  };
}

function validateInteger(raw, { min, message }) {
  const value = String(raw ?? '').trim();
  if (!value) return message;
  if (!/^-?\d+$/.test(value)) return message;

  const num = Number(value);
  if (!Number.isSafeInteger(num) || num < min) return message;
  if (num > INT32_MAX) return INT_OVERFLOW_MESSAGE;

  return '';
}

function validatePrice(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return 'Giá gói phải lớn hơn 0.';

  const num = Number(value.replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return 'Giá gói phải lớn hơn 0.';
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) return 'Giá gói chỉ được có tối đa 2 chữ số thập phân.';

  // decimal(18,2) — chặn phần nguyên dài hơn 16 chữ số.
  const integerDigits = value.split(/[.,]/)[0].replace(/^0+(?=\d)/, '').length;
  if (integerDigits > PRICE_MAX_INTEGER_DIGITS) return 'Giá gói vượt quá giới hạn cho phép.';

  return '';
}

/**
 * @param {object} form  giá trị thô của form (chuỗi)
 * @param {'create'|'edit'} mode
 * @returns {Record<string, string>} chỉ chứa field có lỗi
 */
export function validatePlanForm(form, mode = 'create') {
  const errors = {};

  if (mode === 'create') {
    const name = String(form.name ?? '').trim();
    if (!name) errors.name = 'Tên gói đăng ký không được để trống.';
    else if (name.length > NAME_MAX_LENGTH)
      errors.name = `Tên gói đăng ký không được vượt quá ${NAME_MAX_LENGTH} ký tự.`;

    const tierLevel = validateInteger(form.tierLevel, {
      min: 1,
      message: 'Cấp độ gói phải lớn hơn 0.',
    });
    if (tierLevel) errors.tierLevel = tierLevel;

    const durationInDays = validateInteger(form.durationInDays, {
      min: 1,
      message: 'Thời hạn gói phải lớn hơn 0 ngày.',
    });
    if (durationInDays) errors.durationInDays = durationInDays;
  }

  const description = String(form.description ?? '').trim();
  if (description.length > DESCRIPTION_MAX_LENGTH)
    errors.description = `Mô tả gói không được vượt quá ${DESCRIPTION_MAX_LENGTH} ký tự.`;

  const price = validatePrice(form.price);
  if (price) errors.price = price;

  // 0 là giá trị hợp lệ cho cả ba *Limit và DisplayOrder.
  const aiTokenLimit = validateInteger(form.aiTokenLimit, {
    min: 0,
    message: 'Giới hạn AI Token không hợp lệ.',
  });
  if (aiTokenLimit) errors.aiTokenLimit = aiTokenLimit;

  const aiPracticeScenarioLimit = validateInteger(form.aiPracticeScenarioLimit, {
    min: 0,
    message: 'Giới hạn số lần AI Practice không hợp lệ.',
  });
  if (aiPracticeScenarioLimit) errors.aiPracticeScenarioLimit = aiPracticeScenarioLimit;

  const expertEvaluationLimit = validateInteger(form.expertEvaluationLimit, {
    min: 0,
    message: 'Giới hạn số lần đánh giá chuyên gia không hợp lệ.',
  });
  if (expertEvaluationLimit) errors.expertEvaluationLimit = expertEvaluationLimit;

  const displayOrder = validateInteger(form.displayOrder, {
    min: 0,
    message: 'Thứ tự hiển thị không hợp lệ.',
  });
  if (displayOrder) errors.displayOrder = displayOrder;

  return errors;
}

/** Chuẩn hóa form → payload gửi lên server (đã trim, đã ép kiểu số). */
export function buildPlanPayload(form, mode = 'create') {
  const description = String(form.description ?? '').trim();

  const shared = {
    description: description || null,
    price: Number(String(form.price).trim().replace(',', '.')),
    aiTokenLimit: Number(String(form.aiTokenLimit).trim()),
    aiPracticeScenarioLimit: Number(String(form.aiPracticeScenarioLimit).trim()),
    expertEvaluationLimit: Number(String(form.expertEvaluationLimit).trim()),
    displayOrder: Number(String(form.displayOrder).trim()),
  };

  if (mode === 'edit') return shared;

  return {
    name: String(form.name ?? '').trim(),
    ...shared,
    tierLevel: Number(String(form.tierLevel).trim()),
    durationInDays: Number(String(form.durationInDays).trim()),
  };
}
