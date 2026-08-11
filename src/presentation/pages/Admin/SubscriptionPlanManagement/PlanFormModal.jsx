import { useMemo, useRef, useState } from 'react';
import useModalA11y from '@state/hooks/useModalA11y';
import { resolveApiError } from '@services/api';
import { INT32_MAX, formatDuration, formatNumber } from '@services/subscriptionPlan';
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from "@services/adminSubscriptionPlanApi";
import {
  CREATE_FIELD_ORDER,
  DESCRIPTION_MAX_LENGTH,
  EDIT_FIELD_ORDER,
  FIELD_BY_ERROR_CODE,
  NAME_MAX_LENGTH,
  buildPlanPayload,
  emptyPlanForm,
  planToForm,
  validatePlanForm,
} from './planValidation';
import styles from './SubscriptionPlanManagement.module.css';

const NUMBER_FIELDS = [
  {
    name: 'price',
    label: 'Giá gói',
    group: 'Thương mại',
    min: '0.01',
    step: '0.01',
    hint: 'Tối đa 2 chữ số thập phân.',
    createOnly: false,
  },
  { name: 'tierLevel', label: 'Cấp độ gói (Tier)', group: 'Thương mại', min: '1', step: '1', createOnly: true },
  {
    name: 'durationInDays',
    label: 'Thời hạn (ngày)',
    group: 'Thương mại',
    min: '1',
    step: '1',
    createOnly: true,
  },
  { name: 'aiTokenLimit', label: 'Giới hạn AI Token', group: 'Quyền lợi', min: '0', step: '1', createOnly: false },
  {
    name: 'aiPracticeScenarioLimit',
    label: 'Lượt AI Practice',
    group: 'Quyền lợi',
    min: '0',
    step: '1',
    createOnly: false,
  },
  {
    name: 'expertEvaluationLimit',
    label: 'Lượt đánh giá chuyên gia',
    group: 'Quyền lợi',
    min: '0',
    step: '1',
    createOnly: false,
  },
  {
    name: 'displayOrder',
    label: 'Thứ tự hiển thị',
    group: 'Hiển thị',
    min: '0',
    step: '1',
    hint: '0 là giá trị hợp lệ — số nhỏ hiển thị trước.',
    createOnly: false,
  },
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className={styles.fieldError} id={id}>
      <i className="fas fa-circle-exclamation" aria-hidden="true" /> {message}
    </p>
  );
}

export default function PlanFormModal({ mode, plan, onClose, onSaved, onNotFound }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(() => (isEdit ? planToForm(plan) : { ...emptyPlanForm }));
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);

  const fieldRefs = useRef({});
  const containerRef = useModalA11y(() => {
    if (!saving) onClose();
  });

  const fieldOrder = isEdit ? EDIT_FIELD_ORDER : CREATE_FIELD_ORDER;
  const visibleNumberFields = useMemo(
    () => NUMBER_FIELDS.filter((field) => !isEdit || !field.createOnly),
    [isEdit]
  );

  const focusFirstError = (nextErrors) => {
    const firstField = fieldOrder.find((name) => nextErrors[name]);
    fieldRefs.current[firstField]?.focus?.();
  };

  const setValue = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    setBanner('');
  };

  const applyServerError = ({ errorCode, errorMessage }) => {
    const field = FIELD_BY_ERROR_CODE[errorCode];

    if (field) {
      const nextErrors = { [field]: errorMessage || 'Giá trị không hợp lệ.' };
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    // VALIDATION_ERROR hoặc mã không nằm trong bảng → banner ở đầu form.
    setBanner(errorMessage || 'Không thể lưu gói đăng ký. Vui lòng thử lại.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    // Validate đủ ở client, hiện toàn bộ lỗi cùng lúc, chưa gọi API nếu có lỗi.
    const nextErrors = validatePlanForm(form, mode);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setBanner('');
      focusFirstError(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    setBanner('');

    try {
      const payload = buildPlanPayload(form, mode);
      const res = isEdit
        ? await updateSubscriptionPlan(plan.id, payload)
        : await createSubscriptionPlan(payload);

      if (res.success) {
        onSaved(isEdit ? 'Đã cập nhật gói đăng ký.' : 'Đã tạo gói đăng ký.');
        return;
      }

      if (res.errorCode === 'PLAN_NOT_FOUND') {
        onNotFound();
        return;
      }

      applyServerError(res);
    } catch (err) {
      const apiError = resolveApiError(err);

      if (apiError.errorCode === 'PLAN_NOT_FOUND') {
        onNotFound();
        return;
      }

      if (apiError.errorCode || apiError.errorMessage) {
        applyServerError(apiError);
      } else if (apiError.status === 400) {
        // Ngoài envelope: ValidationProblemDetails của .NET (ví dụ tràn int32).
        setBanner('Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại các trường số.');
      } else {
        setBanner('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderNumberField = ({ name, label, min, step, hint }) => {
    const errorId = `plan-${name}-error`;
    const hintId = `plan-${name}-hint`;
    const describedBy = [hint ? hintId : null, errors[name] ? errorId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.formGroup} key={name}>
        <label htmlFor={`plan-${name}`}>
          {label} <span className={styles.required}>*</span>
        </label>
        <input
          id={`plan-${name}`}
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          max={INT32_MAX}
          value={form[name]}
          onChange={(e) => setValue(name, e.target.value)}
          disabled={saving}
          aria-invalid={errors[name] ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          ref={(el) => {
            fieldRefs.current[name] = el;
          }}
        />
        {hint && (
          <p className={styles.fieldHint} id={hintId}>
            {hint}
          </p>
        )}
        <FieldError id={errorId} message={errors[name]} />
      </div>
    );
  };

  const groups = ['Thương mại', 'Quyền lợi', 'Hiển thị'];

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        tabIndex={-1}
        ref={containerRef}
      >
        <div className={styles.modalHeader}>
          <h2 id="plan-modal-title">{isEdit ? 'Cập nhật gói đăng ký' : 'Tạo gói đăng ký mới'}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {banner && (
            <div className={styles.formBanner} role="alert">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              <span>{banner}</span>
            </div>
          )}

          {isEdit && (
            <>
              {/* §5.1 — ba trường bất biến, render read-only để admin không tưởng đã lưu */}
              <div className={styles.readonlyGrid}>
                <div className={styles.readonlyCard}>
                  <span className={styles.readonlyLabel}>Tên gói</span>
                  <div className={styles.readonlyValue}>{plan.name}</div>
                </div>
                <div className={styles.readonlyCard}>
                  <span className={styles.readonlyLabel}>Cấp độ gói (Tier)</span>
                  <div className={styles.readonlyValue}>{formatNumber(plan.tierLevel)}</div>
                </div>
                <div
                  className={styles.readonlyCard}
                  title="Backend hiện chưa hỗ trợ sửa thời hạn gói."
                >
                  <span className={styles.readonlyLabel}>
                    Thời hạn <i className="fas fa-circle-info" aria-hidden="true" />
                  </span>
                  <div className={styles.readonlyValue}>{formatDuration(plan.durationInDays)}</div>
                </div>
              </div>

              <p className={styles.modalNote}>
                <i className="fas fa-lock" aria-hidden="true" />
                Tên gói và cấp độ không thể thay đổi sau khi tạo. Thời hạn gói hiện chưa sửa được.
              </p>

              <p className={styles.modalNote}>
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                Thay đổi chỉ áp dụng cho các lượt mua và gia hạn sau này. Các gói đăng ký đã bán vẫn
                giữ nguyên cấu hình tại thời điểm mua.
              </p>
            </>
          )}

          {!isEdit && (
            <>
              <h3 className={styles.formSectionTitle}>Định danh</h3>

              <div className={styles.formGroup}>
                <label htmlFor="plan-name">
                  Tên gói <span className={styles.required}>*</span>
                </label>
                <input
                  id="plan-name"
                  name="name"
                  type="text"
                  maxLength={NAME_MAX_LENGTH}
                  value={form.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  placeholder="Ví dụ: Premium"
                  disabled={saving}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'plan-name-error' : undefined}
                  ref={(el) => {
                    fieldRefs.current.name = el;
                  }}
                />
                <FieldError id="plan-name-error" message={errors.name} />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="plan-description">Mô tả gói</label>
            <textarea
              id="plan-description"
              name="description"
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={form.description}
              onChange={(e) => setValue('description', e.target.value)}
              placeholder="Mô tả ngắn gọn quyền lợi của gói (không bắt buộc)"
              disabled={saving}
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'plan-description-error' : undefined}
              ref={(el) => {
                fieldRefs.current.description = el;
              }}
            />
            <p className={styles.charCounter}>
              {String(form.description ?? '').length}/{DESCRIPTION_MAX_LENGTH}
            </p>
            <FieldError id="plan-description-error" message={errors.description} />
          </div>

          {groups.map((group) => {
            const fields = visibleNumberFields.filter((field) => field.group === group);
            if (fields.length === 0) return null;

            return (
              <div key={group}>
                <h3 className={styles.formSectionTitle}>{group}</h3>
                <div className={styles.formGrid}>{fields.map(renderNumberField)}</div>
              </div>
            );
          })}

          {!isEdit && (
            <p className={styles.modalNote}>
              <i className="fas fa-circle-info" aria-hidden="true" />
              Gói mới luôn được tạo ở trạng thái <strong>Đang bán</strong>.
            </p>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Đang lưu...
                </>
              ) : (
                <>{isEdit ? 'Lưu thay đổi' : 'Tạo gói'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
