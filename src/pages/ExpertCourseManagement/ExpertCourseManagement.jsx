import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ExpertCourseManagement.module.css';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

const LEVELS = [
  { value: 'Beginner',     label: 'Mới bắt đầu' },
  { value: 'Intermediate', label: 'Trung cấp'   },
  { value: 'Advanced',     label: 'Nâng cao'    },
];

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
      {message}
    </div>
  );
}

/* ── Confirm Dialog ────────────────────────────────────────────────────────── */
function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.dialog}>
        <div className={styles.dialogIcon}>
          <i className={`fas ${danger ? 'fa-exclamation-triangle' : 'fa-question-circle'}`} />
        </div>
        <h3 className={styles.dialogTitle}>{title}</h3>
        <p className={styles.dialogMsg}>{message}</p>
        <div className={styles.dialogActions}>
          <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
          <button
            className={danger ? styles.btnDanger : styles.btnConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Course Form Modal ─────────────────────────────────────────────────────── */
function CourseFormModal({ mode, initialData, categories, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  const [form, setForm] = useState({
    name:         initialData?.name         ?? '',
    categoryId:   initialData?.categoryId   ?? '',
    level:        initialData?.level        ?? 'Beginner',
    description:  initialData?.description  ?? '',
    thumbnailUrl: initialData?.thumbnailUrl ?? '',
    tagIds:       initialData?.tagIds       ?? [],
  });
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /* ── tags state ── */
  const [tags,        setTags]        = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  /* ── inline create-tag state ── */
  const [showNewTag,   setShowNewTag]   = useState(false);
  const [newTagName,   setNewTagName]   = useState('');
  const [newTagCode,   setNewTagCode]   = useState('');
  const [newTagSaving, setNewTagSaving] = useState(false);
  const [newTagErrors, setNewTagErrors] = useState({});
  const [newTagError,  setNewTagError]  = useState('');

  /* ── request-verification state ── */
  const [verifyTag,    setVerifyTag]    = useState(null); // tag object
  const [verifyNote,   setVerifyNote]   = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [verifyError,  setVerifyError]  = useState('');

  useEffect(() => {
    setTagsLoading(true);
    Promise.all([api.get('/tags'), api.get('/tags/me')])
      .then(([pubRes, myRes]) => {
        const pub = pubRes.data.success ? (pubRes.data.data ?? []) : [];
        const my  = myRes.data.success  ? (myRes.data.data  ?? []) : [];
        const merged = [...pub];
        my.forEach(t => { if (!merged.find(p => p.id === t.id)) merged.push(t); });
        setTags(merged);
      })
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  const clearFieldError = field =>
    setFieldErrors(prev => ({ ...prev, [field]: '' }));

  const handleChange = e => {
    const { name, value } = e.target;
    setFormError('');
    clearFieldError(name);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Validate URL format
  const isValidUrl = url => {
    try { new URL(url); return true; } catch { return false; }
  };

  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    if (!name)                  errs.name = 'Tên khóa học không được để trống.';
    else if (name.length < 3)   errs.name = 'Tên khóa học phải có ít nhất 3 ký tự.';
    else if (name.length > 150) errs.name = 'Tên khóa học không được vượt quá 150 ký tự.';

    if (!form.categoryId)       errs.categoryId = 'Vui lòng chọn danh mục.';

    if (form.thumbnailUrl.trim() && !isValidUrl(form.thumbnailUrl.trim()))
      errs.thumbnailUrl = 'URL ảnh bìa không hợp lệ. Phải bắt đầu bằng https://.';

    if (form.description.length > 1000)
      errs.description = `Mô tả không được vượt quá 1000 ký tự (hiện tại: ${form.description.length}).`;

    return errs;
  };

  const toggleTag = tagId => {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  /* ── inline new-tag helpers ── */
  const autoCode = val =>
    val.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/\s+/g, '-');

  const handleNewTagNameChange = e => {
    const val = e.target.value;
    setNewTagName(val);
    setNewTagCode(autoCode(val));
    setNewTagErrors({});
    setNewTagError('');
  };

  const validateNewTag = () => {
    const errs = {};
    const n = newTagName.trim(), c = newTagCode.trim();
    if (!n)                errs.name = 'Tên tag không được để trống.';
    else if (n.length < 2) errs.name = 'Tên tag phải có ít nhất 2 ký tự.';
    else if (n.length > 50) errs.name = 'Tên tag tối đa 50 ký tự.';
    if (!c)                errs.code = 'Code tag không được để trống.';
    else if (c.length < 2) errs.code = 'Code tag phải có ít nhất 2 ký tự.';
    else if (c.length > 50) errs.code = 'Code tag tối đa 50 ký tự.';
    else if (!CODE_PATTERN.test(c))
      errs.code = 'Chỉ dùng chữ thường, số, dấu gạch ngang. Không bắt đầu/kết thúc bằng -.';
    return errs;
  };

  const handleCreateTag = async () => {
    const errs = validateNewTag();
    if (Object.keys(errs).length > 0) { setNewTagErrors(errs); return; }
    setNewTagSaving(true);
    setNewTagError('');
    try {
      const res = await api.post('/tags/custom', { name: newTagName.trim(), code: newTagCode.trim() });
      if (res.data.success) {
        const created = res.data.data;
        setTags(prev => [created, ...prev]);
        setForm(prev => ({ ...prev, tagIds: [...prev.tagIds, created.id] }));
        setNewTagName(''); setNewTagCode(''); setShowNewTag(false);
      } else {
        setNewTagError(res.data.errorMessage || 'Tạo tag thất bại.');
      }
    } catch (err) {
      setNewTagError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setNewTagSaving(false);
    }
  };

  /* ── request verification for an unpublished tag ── */
  const handleTagClick = tag => {
    if (tag.isPublished) { toggleTag(tag.id); return; }
    // Chờ duyệt → chỉ hiện thông báo, không cho chọn
    if (tag.publishRequest?.status === 'Pending') return;
    // Chưa gửi hoặc bị từ chối → mở modal gửi duyệt
    setVerifyTag(tag);
    setVerifyNote('');
    setVerifyError('');
  };

  const handleSendVerification = async () => {
    setVerifySaving(true);
    setVerifyError('');
    try {
      const res = await api.post(`/tags/${verifyTag.id}/request-verification`, {
        note: verifyNote.trim() || null,
      });
      if (res.data.success) {
        setTags(prev => prev.map(t => t.id === verifyTag.id ? res.data.data : t));
        setVerifyTag(null);
      } else {
        setVerifyError(res.data.errorMessage || 'Gửi yêu cầu thất bại.');
      }
    } catch (err) {
      setVerifyError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setVerifySaving(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFormError('Vui lòng kiểm tra lại các trường bên dưới.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name:         form.name.trim(),
        categoryId:   form.categoryId,
        level:        form.level,
        description:  form.description.trim() || null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        tagIds:       form.tagIds,
      };

      let res;
      if (isEdit) {
        res = await api.put(`/experts/me/courses/${initialData.id}`, payload);
      } else {
        res = await api.post('/experts/me/courses', payload);
      }

      if (res.data.success) {
        onSaved(res.data.data, isEdit ? 'edit' : 'create');
      } else {
        setFormError(res.data.errorMessage || 'Lưu thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setFormError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.formModal}`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className={`fas ${isEdit ? 'fa-pen' : 'fa-plus-circle'}`} />
            {isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {/* Tên */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-book" /> Tên khóa học *</label>
              <input
                name="name"
                className={`${styles.formInput} ${fieldErrors.name ? styles.inputError : ''}`}
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Machine Learning cơ bản"
                autoFocus
              />
              {fieldErrors.name && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.name}</span>}
              <span className={styles.charCount}>{form.name.length}/150</span>
            </div>

            {/* Category + Level row */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-tag" /> Danh mục *</label>
                <select
                  name="categoryId"
                  className={`${styles.formSelect} ${fieldErrors.categoryId ? styles.inputError : ''}`}
                  value={form.categoryId}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {fieldErrors.categoryId && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.categoryId}</span>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-signal" /> Trình độ *</label>
                <select name="level" className={styles.formSelect} value={form.level} onChange={handleChange}>
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thumbnail URL */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-image" /> URL ảnh bìa</label>
              <input
                name="thumbnailUrl"
                className={`${styles.formInput} ${fieldErrors.thumbnailUrl ? styles.inputError : ''}`}
                value={form.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
              {fieldErrors.thumbnailUrl && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.thumbnailUrl}</span>}
              {form.thumbnailUrl && !fieldErrors.thumbnailUrl && (
                <div className={styles.thumbPreview}>
                  <img
                    src={form.thumbnailUrl}
                    alt="Preview"
                    onError={e => { e.target.src = FALLBACK_THUMB; }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-align-left" /> Mô tả khóa học</label>
              <textarea
                name="description"
                className={`${styles.formTextarea} ${fieldErrors.description ? styles.inputError : ''}`}
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả nội dung, mục tiêu, đối tượng học viên..."
              />
              {fieldErrors.description
                ? <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.description}</span>
                : <span className={styles.charCount}>{form.description.length}/1000</span>
              }
            </div>

            {/* ── TAGS ── */}
            <div className={styles.formGroup}>
              <div className={styles.tagLabelRow}>
                <label className={styles.formLabel}><i className="fas fa-hashtag" /> Kỹ năng / Tags</label>
                <button
                  type="button"
                  className={styles.tagCreateLink}
                  onClick={() => { setShowNewTag(v => !v); setNewTagErrors({}); setNewTagError(''); }}
                >
                  <i className={`fas ${showNewTag ? 'fa-minus' : 'fa-plus'}`} />
                  {showNewTag ? 'Đóng' : 'Tạo tag mới'}
                </button>
              </div>

              {showNewTag && (
                <div className={styles.inlineTagForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}><i className="fas fa-tag" /> Tên tag *</label>
                      <input
                        className={`${styles.formInput} ${newTagErrors.name ? styles.inputError : ''}`}
                        value={newTagName}
                        onChange={handleNewTagNameChange}
                        placeholder="VD: Machine Learning"
                        maxLength={50}
                      />
                      {newTagErrors.name
                        ? <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {newTagErrors.name}</span>
                        : <span className={styles.charCount}>{newTagName.trim().length}/50</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}><i className="fas fa-code" /> Code tag *</label>
                      <input
                        className={`${styles.formInput} ${styles.codeInput} ${newTagErrors.code ? styles.inputError : ''}`}
                        value={newTagCode}
                        onChange={e => { setNewTagCode(e.target.value); setNewTagErrors(p => ({ ...p, code: '' })); }}
                        placeholder="machine-learning"
                        maxLength={50}
                      />
                      {newTagErrors.code
                        ? <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {newTagErrors.code}</span>
                        : <span className={styles.charCount}>a-z, 0-9, - · {newTagCode.trim().length}/50</span>}
                    </div>
                  </div>
                  {newTagError && (
                    <div className={styles.formError}>
                      <i className="fas fa-exclamation-circle" /> {newTagError}
                    </div>
                  )}
                  <div className={styles.inlineTagNote}>
                    <i className="fas fa-info-circle" /> Tag mới sẽ ở trạng thái chưa duyệt và được chọn ngay vào khóa học.
                  </div>
                  <button type="button" className={styles.btnInlineCreate} onClick={handleCreateTag} disabled={newTagSaving}>
                    {newTagSaving ? <><span className={styles.spinner} /> Đang tạo...</> : <><i className="fas fa-plus" /> Tạo & chọn tag</>}
                  </button>
                </div>
              )}

              {tagsLoading ? (
                <div className={styles.tagPickerLoading}><span className={styles.spinner} /> Đang tải tags...</div>
              ) : tags.length > 0 ? (
                <div className={styles.tagPicker}>
                  {tags.map(tag => {
                    const isPending  = !tag.isPublished && tag.publishRequest?.status === 'Pending';
                    const isUnpub    = !tag.isPublished;
                    const isSelected = form.tagIds.includes(tag.id);
                    let cls = styles.tagBtn;
                    if (isSelected)   cls += ` ${styles.tagBtnActive}`;
                    if (isPending)    cls += ` ${styles.tagBtnPending}`;
                    else if (isUnpub) cls += ` ${styles.tagBtnUnpub}`;

                    const title = isPending
                      ? 'Tag đang chờ duyệt — không thể chọn'
                      : isUnpub
                        ? 'Tag chưa được duyệt — nhấn để gửi yêu cầu xét duyệt'
                        : undefined;

                    return (
                      <button
                        type="button"
                        key={tag.id}
                        className={cls}
                        onClick={() => handleTagClick(tag)}
                        title={title}
                        aria-disabled={isUnpub}
                      >
                        {tag.name}
                        {isPending && <span className={styles.tagStatusIcon} title="Đang chờ duyệt"><i className="fas fa-clock" /></span>}
                        {isUnpub && !isPending && <span className={styles.tagStatusIcon} title="Chưa duyệt"><i className="fas fa-exclamation-circle" /></span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.tagEmpty}>Chưa có tag nào. Nhấn "Tạo tag mới" để thêm.</p>
              )}
            </div>

            {formError && (
              <div className={styles.formError}>
                <i className="fas fa-exclamation-circle" /> {formError}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving
                ? <><span className={styles.spinner} /> Đang lưu...</>
                : <><i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'}`} /> {isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Modal gửi yêu cầu xét duyệt tag ── */}
      {verifyTag && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setVerifyTag(null)}>
          <div className={styles.verifyModal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <i className="fas fa-paper-plane" /> Gửi yêu cầu xét duyệt
              </div>
              <button className={styles.modalClose} onClick={() => setVerifyTag(null)} aria-label="Đóng">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.tagPreviewBox}>
                <span className={styles.tagPreviewName}>{verifyTag.name}</span>
                <code className={styles.tagPreviewCode}>{verifyTag.code}</code>
              </div>
              <div className={styles.infoBoxBlue}>
                <i className="fas fa-info-circle" />
                Sau khi được admin duyệt, tag sẽ xuất hiện công khai và có thể gắn vào khóa học.
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-comment-alt" /> Ghi chú cho admin <span className={styles.labelOptional}>(không bắt buộc)</span></label>
                <textarea
                  className={styles.formTextarea}
                  value={verifyNote}
                  onChange={e => setVerifyNote(e.target.value)}
                  placeholder="Mô tả ngắn về tag này, lý do muốn thêm..."
                  rows={3}
                />
              </div>
              {verifyError && (
                <div className={styles.formError}>
                  <i className="fas fa-exclamation-circle" /> {verifyError}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setVerifyTag(null)}>Hủy</button>
              <button className={styles.btnSave} onClick={handleSendVerification} disabled={verifySaving}>
                {verifySaving
                  ? <><span className={styles.spinner} /> Đang gửi...</>
                  : <><i className="fas fa-paper-plane" /> Gửi yêu cầu</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tooltip chờ duyệt (hiện dưới dạng banner nhỏ khi hover tag pending) ── */}
    </div>
  );
}

/* ── Course Row Card ──────────────────────────────────────────────────────── */
function CourseRow({ course, onEdit, onPublish, onUnpublish }) {
  const isPublished = course.isPublished;
  const [busy, setBusy] = useState(false);

  const handlePublishToggle = async () => {
    setBusy(true);
    if (isPublished) await onUnpublish(course.id);
    else await onPublish(course.id);
    setBusy(false);
  };

  return (
    <div className={styles.courseRow}>
      <div className={styles.rowThumb}>
        <img
          src={course.thumbnailUrl || FALLBACK_THUMB}
          alt={course.name}
          onError={e => { e.target.src = FALLBACK_THUMB; }}
          loading="lazy"
        />
      </div>

      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={`${styles.statusPill} ${isPublished ? styles.published : styles.draft}`}>
            <i className={`fas ${isPublished ? 'fa-globe' : 'fa-pencil-alt'}`} />
            {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
          </span>
          <span className={styles.levelBadge}>{LEVEL_LABELS[course.level] ?? course.level}</span>
        </div>

        <h3 className={styles.rowTitle}>{course.name}</h3>

        {course.description && (
          <p className={styles.rowDesc}>{course.description}</p>
        )}

        <div className={styles.rowMeta}>
          {course.category?.name && (
            <span><i className="fas fa-tag" /> {course.category.name}</span>
          )}
          <span><i className="fas fa-clock" /> {course.durationHours}h</span>
          <span><i className="fas fa-layer-group" /> {course.totalModules ?? 0} module</span>
          <span><i className="fas fa-book-open" /> {course.totalMaterials ?? 0} bài</span>
        </div>
      </div>

      <div className={styles.rowActions}>
        <button
          className={styles.actionBtn}
          onClick={() => onEdit(course)}
          title="Chỉnh sửa thông tin"
        >
          <i className="fas fa-pen" /> Sửa
        </button>

        <Link
          to={`/expert/courses/${course.id}/modules`}
          className={styles.actionBtn}
          title="Quản lý module & bài học"
        >
          <i className="fas fa-list-ul" /> Module
        </Link>

        {isPublished ? (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
            onClick={handlePublishToggle}
            disabled={busy}
            title="Hủy xuất bản"
          >
            {busy
              ? <span className={styles.spinner} />
              : <><i className="fas fa-eye-slash" /> Ẩn</>}
          </button>
        ) : (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
            onClick={handlePublishToggle}
            disabled={busy}
            title="Xuất bản khóa học"
          >
            {busy
              ? <span className={styles.spinner} />
              : <><i className="fas fa-globe" /> Xuất bản</>}
          </button>
        )}

        {isPublished && (
          <Link
            to={`/courses/${course.id}`}
            target="_blank"
            className={`${styles.actionBtn} ${styles.actionBtnView}`}
            title="Xem trang công khai"
          >
            <i className="fas fa-eye" /> Xem
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ExpertCourseManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses,    setCourses]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [pageIndex,  setPageIndex]  = useState(0);
  const PAGE_SIZE = 10;

  // Filters
  const [keyword,     setKeyword]     = useState('');
  const [inputVal,    setInputVal]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'published' | 'draft'

  // Modals
  const [showForm,     setShowForm]     = useState(searchParams.get('action') === 'create');
  const [editingCourse,setEditingCourse]= useState(null);
  const [confirm,      setConfirm]      = useState(null); // { type, courseId, courseName }

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  /* ── load categories once ── */
  useEffect(() => {
    api.get('/categories')
      .then(res => { if (res.data.success) setCategories(res.data.data ?? []); })
      .catch(() => {});
  }, []);

  /* ── fetch courses ── */
  const fetchCourses = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = { pageIndex: page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (filterStatus === 'published') params.isPublished = true;
      if (filterStatus === 'draft')     params.isPublished = false;

      const res = await api.get('/experts/me/courses', { params });
      if (res.data.success) {
        const data = res.data.data;
        setTotal(data.totalItems ?? 0);
        if (page === 0) setCourses(data.items ?? []);
        else setCourses(prev => [...prev, ...(data.items ?? [])]);
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login');
    } finally {
      setLoading(false);
    }
  }, [keyword, filterStatus, navigate]);

  useEffect(() => {
    setPageIndex(0);
    fetchCourses(0);
  }, [fetchCourses]);

  /* ── open create modal if ?action=create ── */
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowForm(true);
      setEditingCourse(null);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  /* ── handlers ── */
  const handleSearch = e => {
    e.preventDefault();
    setKeyword(inputVal.trim());
    setPageIndex(0);
  };

  const handleFormSaved = (result, mode) => {
    setShowForm(false);
    setEditingCourse(null);
    showToast(mode === 'create' ? 'Tạo khóa học thành công!' : 'Cập nhật khóa học thành công!');
    fetchCourses(0);
  };

  const handleEdit = course => {
    setEditingCourse({
      id:           course.id,
      name:         course.name,
      categoryId:   course.category?.id ?? '',
      level:        course.level,
      description:  course.description ?? '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      tagIds:       course.tags?.map(t => t.id) ?? [],
    });
    setShowForm(true);
  };

  const handlePublish = useCallback(async courseId => {
    try {
      const res = await api.patch(`/experts/me/courses/${courseId}/publish`);
      if (res.data.success) {
        setCourses(prev =>
          prev.map(c => c.id === courseId ? { ...c, isPublished: true } : c)
        );
        showToast('Khóa học đã được xuất bản thành công!');
      } else {
        showToast(res.data.errorMessage || 'Xuất bản thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || 'Xuất bản thất bại.', 'error');
    }
  }, []);

  const handleUnpublish = useCallback(courseId => {
    const course = courses.find(c => c.id === courseId);
    setConfirm({ type: 'unpublish', courseId, courseName: course?.name });
  }, [courses]);

  const confirmUnpublish = async () => {
    const { courseId } = confirm;
    setConfirm(null);
    try {
      const res = await api.patch(`/experts/me/courses/${courseId}/unpublish`);
      if (res.data.success) {
        setCourses(prev =>
          prev.map(c => c.id === courseId ? { ...c, isPublished: false } : c)
        );
        showToast('Khóa học đã được chuyển về bản nháp.');
      } else {
        showToast(res.data.errorMessage || 'Hủy xuất bản thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.errorMessage || 'Hủy xuất bản thất bại.', 'error');
    }
  };

  const loadMore = () => {
    const next = pageIndex + 1;
    setPageIndex(next);
    fetchCourses(next);
  };

  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount     = courses.filter(c => !c.isPublished).length;
  const hasMore        = courses.length < total;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.breadcrumb}>
              <Link to="/expert">Trang chủ</Link>
              <i className="fas fa-chevron-right" />
              <span>Quản lý khóa học</span>
            </div>
            <h1 className={styles.pageTitle}>
              <i className="fas fa-graduation-cap" /> Quản lý khóa học
            </h1>
            <p className={styles.pageSubtitle}>
              Tạo, chỉnh sửa và quản lý tất cả khóa học của bạn.
            </p>
          </div>
          <button
            className={styles.btnCreate}
            onClick={() => { setEditingCourse(null); setShowForm(true); }}
          >
            <i className="fas fa-plus" /> Tạo khóa học mới
          </button>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────── */}
        <div className={styles.statsBar}>
          <div className={styles.statChip}>
            <span className={styles.statChipNum}>{total}</span>
            <span className={styles.statChipLbl}>Tổng</span>
          </div>
          <div className={`${styles.statChip} ${styles.statChipGreen}`}>
            <span className={styles.statChipNum}>{publishedCount}</span>
            <span className={styles.statChipLbl}>Đã xuất bản</span>
          </div>
          <div className={`${styles.statChip} ${styles.statChipYellow}`}>
            <span className={styles.statChipNum}>{draftCount}</span>
            <span className={styles.statChipLbl}>Bản nháp</span>
          </div>
        </div>

        {/* ── TOOLBAR ────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchWrap}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Tìm theo tên khóa học..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                aria-label="Tìm kiếm"
              />
            </div>
            <button type="submit" className={styles.btnSearch}>Tìm</button>
          </form>

          <div className={styles.filterTabs}>
            {[
              { value: 'all',       label: 'Tất cả'       },
              { value: 'published', label: 'Đã xuất bản' },
              { value: 'draft',     label: 'Bản nháp'    },
            ].map(tab => (
              <button
                key={tab.value}
                className={`${styles.filterTab} ${filterStatus === tab.value ? styles.filterTabActive : ''}`}
                onClick={() => { setFilterStatus(tab.value); setPageIndex(0); }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── COURSE LIST ────────────────────────────────────── */}
        {loading && courses.length === 0 ? (
          <div className={styles.loadingWrap}>
            {[1,2,3].map(i => <div key={i} className={styles.skRow} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><i className="fas fa-book-open" /></div>
            <h3>
              {keyword || filterStatus !== 'all'
                ? 'Không tìm thấy khóa học nào'
                : 'Bạn chưa có khóa học nào'}
            </h3>
            <p>
              {keyword || filterStatus !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Bắt đầu tạo khóa học đầu tiên và chia sẻ kiến thức của bạn.'}
            </p>
            {!keyword && filterStatus === 'all' && (
              <button
                className={styles.btnCreate}
                onClick={() => { setEditingCourse(null); setShowForm(true); }}
              >
                <i className="fas fa-plus" /> Tạo khóa học đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className={styles.courseList}>
            {courses.map(course => (
              <CourseRow
                key={course.id}
                course={course}
                onEdit={handleEdit}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className={styles.loadMoreWrap}>
            <button className={styles.btnLoadMore} onClick={loadMore}>
              <i className="fas fa-chevron-down" /> Xem thêm
            </button>
          </div>
        )}
        {loading && courses.length > 0 && (
          <div className={styles.loadMoreWrap}>
            <span className={styles.spinner} />
          </div>
        )}

      </div>

      {/* ── COURSE FORM MODAL ────────────────────────────────── */}
      {showForm && (
        <CourseFormModal
          mode={editingCourse ? 'edit' : 'create'}
          initialData={editingCourse}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingCourse(null); }}
          onSaved={handleFormSaved}
        />
      )}

      {/* ── CONFIRM UNPUBLISH ────────────────────────────────── */}
      {confirm?.type === 'unpublish' && (
        <ConfirmDialog
          title="Hủy xuất bản khóa học?"
          message={`Khóa học "${confirm.courseName}" sẽ bị ẩn khỏi danh sách công khai và học viên mới không thể đăng ký. Học viên đã đăng ký vẫn có thể truy cập.`}
          confirmLabel="Hủy xuất bản"
          danger
          onConfirm={confirmUnpublish}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── TOAST ────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
