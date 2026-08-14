import { PRICE_MAX_INTEGER_DIGITS, formatNumber } from '@services/subscriptionPlan';

/**
 * Mirror client-side của rule validation phía server (§0.4).
 * Backend fail-fast (chỉ trả lỗi ĐẦU TIÊN) nên FE phải validate đủ và hiện mọi lỗi cùng lúc.
 *
 * Ngoài rule của BE, FE còn siết thêm trần nghiệp vụ (NUMBER_FIELD_RULES) và bộ ký tự cho
 * tên gói — BE chỉ chặn "âm / bằng 0 / tràn int32" nên nếu không siết thì vẫn nhập được
 * những giá trị vô nghĩa như tier 999999 hay gói dài 2 tỷ ngày.
 */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

/**
 * Tên gói: chữ (kể cả tiếng Việt có dấu), số, khoảng trắng và một vài dấu thông dụng.
 * Chặn emoji, ký tự điều khiển và các ký tự dễ gây rối như `<` `>` `{` `}` `|` `\`.
 */
const NAME_PATTERN = /^[\p{L}\p{N} .,\-_+&()/']+$/u;

const SPACE_CODE = 32;
const DELETE_CODE = 127;
const TAB_CODE = 9;
const NEWLINE_CODE = 10;

/**
 * Ký tự điều khiển thường lọt vào khi copy-paste từ file lạ. Dùng codePoint thay vì regex
 * để không phải nhúng ký tự điều khiển vào chính source file này.
 */
const isControlChar = (char, { allowLineBreak = false } = {}) => {
  const code = char.codePointAt(0);
  if (allowLineBreak && (code === TAB_CODE || code === NEWLINE_CODE)) return false;
  return code < SPACE_CODE || code === DELETE_CODE;
};

const hasControlChar = (value, options) =>
  Array.from(value).some((char) => isControlChar(char, options));

const stripControlChars = (value) =>
  Array.from(value)
    .filter((char) => !isControlChar(char))
    .join('');

/**
 * Trần nghiệp vụ cho các trường số. BE chỉ chặn tới int32 nên đây là quy ước của FE —
 * chỉnh ở đúng một chỗ này nếu BA chốt lại con số khác.
 */
export const NUMBER_FIELD_RULES = {
  /*
   * Giá để `integer` dù BE nhận decimal(18,2): tiền VND không có phần lẻ, mà trong vi-VN dấu
   * `.` là phân cách hàng nghìn — nhận số lẻ thì "199.000" (ý là 199 nghìn) sẽ thành 199 đồng.
   * Đổi lại `kind: 'decimal'` nếu BA chốt đơn vị tiền có phần lẻ.
   */
  price: { label: 'Giá gói', kind: 'integer', min: 1, max: 1_000_000_000 },
  tierLevel: { label: 'Cấp độ gói', kind: 'integer', min: 1, max: 100 },
  durationInDays: { label: 'Thời hạn gói', kind: 'integer', min: 1, max: 3650, unit: 'ngày' },
  aiTokenLimit: { label: 'Giới hạn AI Token', kind: 'integer', min: 0, max: 100_000_000 },
  aiPracticeScenarioLimit: { label: 'Lượt AI Practice', kind: 'integer', min: 0, max: 10_000 },
  expertEvaluationLimit: { label: 'Lượt đánh giá chuyên gia', kind: 'integer', min: 0, max: 10_000 },
};

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
  // INVALID_DISPLAY_ORDER không map vào field nào: displayOrder do FE tự gán, không có ô nhập.
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
];

/**
 * UC-91: name/tierLevel bất biến sau khi tạo (§5.1) nên không có ô nhập ở mode edit.
 * durationInDays sửa được — giá trị mới chỉ áp dụng cho lượt mua/gia hạn sau.
 * displayOrder vẫn nằm trong payload nhưng không hiện trong form — đổi bằng reorder ở bảng.
 */
export const EDIT_FIELD_ORDER = [
  'description',
  'price',
  'durationInDays',
  'aiTokenLimit',
  'aiPracticeScenarioLimit',
  'expertEvaluationLimit',
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
  };
}

/* ────────────────────────────── Lọc ký tự khi gõ ────────────────────────────── */

/**
 * Ô số nguyên: chỉ giữ chữ số, bỏ số 0 thừa ở đầu.
 * Lọc ngay lúc gõ nên `e`, `+`, `-`, dấu cách... không bao giờ vào được state.
 */
export function sanitizeIntegerInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 12);
}

/** Ô giá: chữ số + tối đa một dấu thập phân + tối đa 2 chữ số lẻ (dấu `,` quy về `.`). */
export function sanitizePriceInput(raw) {
  const cleaned = String(raw ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');

  const [head, ...rest] = cleaned.split('.');
  const integerPart = head.replace(/^0+(?=\d)/, '').slice(0, PRICE_MAX_INTEGER_DIGITS);

  if (rest.length === 0) return integerPart;
  // Gõ dấu chấm đầu tiên → tự thêm số 0 để không còn chuỗi cụt kiểu ".5".
  return `${integerPart || '0'}.${rest.join('').slice(0, 2)}`;
}

/** Tên gói: chỉ bỏ ký tự điều khiển và xuống dòng — KHÔNG lọc chữ, để gõ tiếng Việt không vỡ. */
export function sanitizeNameInput(raw) {
  const singleLine = String(raw ?? '').replace(/[\r\n\t]/g, ' ');
  return stripControlChars(singleLine).slice(0, NAME_MAX_LENGTH);
}

/* ────────────────────────────── Validate ────────────────────────────── */

const rangeMessage = ({ label, min, max, unit }) => {
  const suffix = unit ? ` ${unit}` : '';
  return `${label} phải nằm trong khoảng ${formatNumber(min)}${suffix} – ${formatNumber(max)}${suffix}.`;
};

function validateNumberField(raw, field) {
  const rule = NUMBER_FIELD_RULES[field];
  const value = String(raw ?? '').trim();

  if (!value) return `${rule.label} không được để trống.`;

  if (rule.kind === 'integer') {
    if (!/^\d+$/.test(value)) return `${rule.label} phải là số nguyên, không chứa ký tự khác.`;

    const num = Number(value);
    if (!Number.isSafeInteger(num) || num < rule.min || num > rule.max) return rangeMessage(rule);

    return '';
  }

  // decimal — dùng cho giá gói.
  const normalized = value.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    return `${rule.label} phải là số dương, tối đa 2 chữ số thập phân.`;

  const num = Number(normalized);
  if (!Number.isFinite(num) || num < rule.min || num > rule.max) return rangeMessage(rule);

  return '';
}

function validateName(raw) {
  const value = String(raw ?? '').trim();

  if (!value) return 'Tên gói đăng ký không được để trống.';
  if (value.length < NAME_MIN_LENGTH)
    return `Tên gói đăng ký phải có ít nhất ${NAME_MIN_LENGTH} ký tự.`;
  if (value.length > NAME_MAX_LENGTH)
    return `Tên gói đăng ký không được vượt quá ${NAME_MAX_LENGTH} ký tự.`;
  if (!NAME_PATTERN.test(value))
    return "Tên gói chỉ gồm chữ, số, khoảng trắng và các dấu . , - _ + & ( ) / '";
  // Tên toàn dấu câu kiểu "---" hay "..." không phải là tên gói.
  if (!/[\p{L}\p{N}]/u.test(value)) return 'Tên gói phải chứa ít nhất một chữ cái hoặc chữ số.';

  return '';
}

function validateDescription(raw) {
  const value = String(raw ?? '').trim();

  if (value.length > DESCRIPTION_MAX_LENGTH)
    return `Mô tả gói không được vượt quá ${DESCRIPTION_MAX_LENGTH} ký tự.`;
  if (hasControlChar(value, { allowLineBreak: true }))
    return 'Mô tả gói chứa ký tự không hợp lệ.';

  return '';
}

/** Danh sách field cần validate theo từng mode (edit: BE bỏ qua name/tierLevel). */
function fieldsToValidate(mode) {
  const numberFields = Object.keys(NUMBER_FIELD_RULES);

  if (mode === 'create') return ['name', 'description', ...numberFields];

  return ['description', ...numberFields.filter((field) => field !== 'tierLevel')];
}

/**
 * @param {object} form  giá trị thô của form (chuỗi)
 * @param {'create'|'edit'} mode
 * @returns {Record<string, string>} chỉ chứa field có lỗi
 */
export function validatePlanForm(form, mode = 'create') {
  const errors = {};

  for (const field of fieldsToValidate(mode)) {
    let message = '';

    if (field === 'name') message = validateName(form.name);
    else if (field === 'description') message = validateDescription(form.description);
    else message = validateNumberField(form[field], field);

    if (message) errors[field] = message;
  }

  return errors;
}

/** Validate đúng một trường — dùng cho onBlur để báo lỗi sớm thay vì đợi submit. */
export function validatePlanField(field, form, mode = 'create') {
  return validatePlanForm(form, mode)[field] ?? '';
}

/**
 * Chuẩn hóa form → payload gửi lên server (đã trim, đã ép kiểu số).
 * @param {number} displayOrder  do trang gọi truyền vào: gói mới lấy số kế tiếp,
 *                               gói đang sửa giữ nguyên số hiện tại (đổi bằng reorder).
 */
export function buildPlanPayload(form, mode = 'create', displayOrder = 0) {
  const description = String(form.description ?? '').trim();

  const shared = {
    description: description || null,
    price: Number(String(form.price).trim().replace(',', '.')),
    durationInDays: Number(String(form.durationInDays).trim()),
    aiTokenLimit: Number(String(form.aiTokenLimit).trim()),
    aiPracticeScenarioLimit: Number(String(form.aiPracticeScenarioLimit).trim()),
    expertEvaluationLimit: Number(String(form.expertEvaluationLimit).trim()),
    displayOrder,
  };

  if (mode === 'edit') return shared;

  return {
    // Gộp khoảng trắng thừa để "Gói   Premium" và "Gói Premium" không thành hai gói khác nhau.
    name: String(form.name ?? '')
      .trim()
      .replace(/\s+/g, ' '),
    ...shared,
    tierLevel: Number(String(form.tierLevel).trim()),
  };
}
