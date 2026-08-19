import { useState, useEffect, useCallback, useRef } from 'react';
import api, { resolveApiError } from '@services/api';
import styles from '../ExpertCourseManagement.module.css';
import RichTextEditor from '../../ModuleManagement/components/common/RichTextEditor';
import ConfirmModal from '@presentation/components/ConfirmModal/ConfirmModal';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';
const LEVELS = [
  { value: 'Beginner', label: 'Mới bắt đầu' },
  { value: 'Intermediate', label: 'Cơ bản' },
  { value: 'Advanced', label: 'Nâng cao' },
];
const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function CourseFormModal({ mode, initialData, categories, onClose, onSaved }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    categoryId: initialData?.categoryId ?? '',
    level: initialData?.level ?? 'Beginner',
    description: initialData?.description ?? '',
    thumbnailUrl: initialData?.thumbnailUrl ?? '',
    durationHours: initialData?.durationHours ?? '',
    tagIds: initialData?.tagIds ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCode, setNewTagCode] = useState('');
  const [newTagSaving, setNewTagSaving] = useState(false);
  const [newTagErrors, setNewTagErrors] = useState({});
  const [newTagError, setNewTagError] = useState('');
  const [verifyTag, setVerifyTag] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeDuplicate, setCodeDuplicate] = useState(false);
  const codeDuplicateRef = useRef(false);
  const checkCodeTimerRef = useRef(null);
  const [duplicateTagCandidate, setDuplicateTagCandidate] = useState(null);

  useEffect(() => {
    setTagsLoading(true);

    // Only get public tags (removed personal tags)
    api.get('/tags')
      .then((pubRes) => {
        const pub = pubRes.data.success ? (pubRes.data.data ?? []) : [];
        const pubNorm = pub.map(t => ({ ...t, isPublished: true }));
        const merged = [...pubNorm];

        // Get course details to extract tags (for both create and edit mode)
        // In create mode, initialData might have tagIds from a duplicated course or other source
        if (initialData?.id) {
          api.get(`/courses/${initialData.id}`)
            .then((courseRes) => {
              if (courseRes.data.success && courseRes.data.data?.tags) {
                const courseTagsData = courseRes.data.data.tags;

                // Add course tags if not already in merged
                courseTagsData.forEach(t => {
                  if (!merged.find(p => p.id === t.id)) {
                    // For tags from course details, use the properties directly from the response
                    // System tags (createdById = null) are always published
                    const isSystemTag = t.createdById === null;

                    merged.push({
                      ...t,
                      isFromCourse: true,
                      // Use isPublished from the course detail response, or mark system tags as published
                      isPublished: t.isPublished || isSystemTag,
                      createdById: t.createdById
                    });
                  }
                });
              }

              setTags(merged);
              setTagsLoading(false);
            })
            .catch(() => {
              // If course details fail to load, still show other tags
              setTags(merged);
              setTagsLoading(false);
            });
        } else {
          setTags(merged);
          setTagsLoading(false);
        }
      })
      .catch(() => {
        setTagsLoading(false);
      });
  }, [initialData?.id]);

  const clearFieldError = field => setFieldErrors(prev => ({ ...prev, [field]: '' }));

  const handleChange = e => {
    const { name, value } = e.target;
    setFormError('');
    clearFieldError(name);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const isValidUrl = url => { try { new URL(url); return true; } catch { return false; } };

  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    if (!name) errs.name = 'Tên khóa học không được để trống.';
    else if (name.length < 3) errs.name = 'Tên khóa học phải có ít nhất 3 ký tự.';
    else if (name.length > 150) errs.name = 'Tên khóa học không được vượt quá 150 ký tự.';
    if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục.';

    // Validate duration
    const duration = parseFloat(form.durationHours);
    if (form.durationHours && (isNaN(duration) || duration < 0)) {
      errs.durationHours = 'Thời lượng phải là số không âm.';
    } else if (duration > 1000) {
      errs.durationHours = 'Thời lượng không được vượt quá 1000 giờ.';
    }

    if (form.thumbnailUrl.trim() && !isValidUrl(form.thumbnailUrl.trim()))
      errs.thumbnailUrl = 'URL ảnh bìa không hợp lệ. Phải bắt đầu bằng https://.';
    if (form.description.length > 5000)
      errs.description = `Mô tả không được vượt quá 5000 ký tự.`;
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

  const autoCode = val =>
    val.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/\s+/g, '-');

  const scheduleCodeCheck = useCallback((code) => {
    codeDuplicateRef.current = false;
    setCodeDuplicate(false);
    setDuplicateTagCandidate(null);
    if (checkCodeTimerRef.current) clearTimeout(checkCodeTimerRef.current);
    if (code.trim().length >= 2) {
      checkCodeTimerRef.current = setTimeout(async () => {
        setCodeChecking(true);
        try {
          const res = await api.get('/tags/by-code', { params: { code: code.trim() } });
          if (res.data.success) {
            const found = res.data.data;
            codeDuplicateRef.current = found !== null;
            setCodeDuplicate(found !== null);
            if (found) setDuplicateTagCandidate(found);
          }
        } catch { /* silent */ } finally { setCodeChecking(false); }
      }, 500);
    }
  }, []);

  const handleNewTagNameChange = e => {
    const val = e.target.value;
    const generatedCode = autoCode(val);
    setNewTagName(val); setNewTagCode(generatedCode);
    setNewTagErrors({}); setNewTagError('');
    // Remove real-time checking
    setCodeDuplicate(false);
    setDuplicateTagCandidate(null);
    codeDuplicateRef.current = false;
  };

  const handleNewTagCodeChange = e => {
    const val = e.target.value;
    setNewTagCode(val);
    setNewTagErrors(p => ({ ...p, code: '' }));
    // Remove real-time checking
    setCodeDuplicate(false);
    setDuplicateTagCandidate(null);
    codeDuplicateRef.current = false;
  };

  const validateNewTag = () => {
    const errs = {};
    const n = newTagName.trim(), c = newTagCode.trim();
    if (!n) errs.name = 'Tên tag không được để trống.';
    else if (n.length < 2) errs.name = 'Tên tag phải có ít nhất 2 ký tự.';
    else if (n.length > 50) errs.name = 'Tên tag tối đa 50 ký tự.';
    if (!c) errs.code = 'Code tag không được để trống.';
    else if (c.length < 2) errs.code = 'Code tag phải có ít nhất 2 ký tự.';
    else if (c.length > 50) errs.code = 'Code tag tối đa 50 ký tự.';
    else if (!CODE_PATTERN.test(c))
      errs.code = 'Chỉ dùng chữ thường, số, dấu gạch ngang. Không bắt đầu/kết thúc bằng -.';
    return errs;
  };

  const handleCreateTag = async () => {
    const errs = validateNewTag();
    if (Object.keys(errs).length > 0) { setNewTagErrors(errs); return; }

    // Check for duplicate when creating tag
    setNewTagSaving(true); setNewTagError('');
    try {
      // First check if tag already exists
      const checkRes = await api.get('/tags/by-code', { params: { code: newTagCode.trim() } });
      if (checkRes.data.success && checkRes.data.data) {
        const existingTag = checkRes.data.data;
        setDuplicateTagCandidate(existingTag);
        setNewTagError('Tag với code này đã tồn tại. Nhấn "Dùng tag này" để thêm tag đó vào khóa học hoặc thay đổi code tag.');
        setNewTagSaving(false);
        return;
      }

      // If no duplicate, create the tag
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
    } finally { setNewTagSaving(false); }
  };

  const handleConfirmUseDuplicateTag = () => {
    const tag = duplicateTagCandidate;
    if (!tag) return;
    setTags(prev => prev.find(t => t.id === tag.id) ? prev : [tag, ...prev]);
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
    }));
    setDuplicateTagCandidate(null);
    setNewTagName(''); setNewTagCode(''); setShowNewTag(false);
    codeDuplicateRef.current = false; setCodeDuplicate(false);
  };

  const handleTagClick = tag => {
    if (duplicateTagCandidate?.id === tag.id) {
      if (!form.tagIds.includes(tag.id)) {
        handleConfirmUseDuplicateTag();
        return;
      }
    }
    toggleTag(tag.id);
  };

  const handleOpenVerifyModal = (tag, e) => {
    if (e) e.stopPropagation();
    if (duplicateTagCandidate?.id === tag.id) return;
    if (tag.publishRequest?.status === 'Pending') return;
    setVerifyTag(tag); setVerifyNote(''); setVerifyError('');
  };

  const handleSendVerification = async () => {
    setVerifySaving(true); setVerifyError('');
    try {
      const res = await api.post(`/tags/${verifyTag.id}/request-verification`, {
        note: verifyNote.trim() || null,
      });
      if (res.data.success) {
        setTags(prev => prev.map(t => t.id === verifyTag.id ? res.data.data : t));
        setVerifyTag(null);
      } else { setVerifyError(res.data.errorMessage || 'Gửi yêu cầu thất bại.'); }
    } catch (err) {
      setVerifyError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally { setVerifySaving(false); }
  };

  const [cancelPublishRequestTagId, setCancelPublishRequestTagId] = useState(null);

  const handleDeletePublishRequest = (tagId) => {
    setCancelPublishRequestTagId(tagId);
  };

  const executeCancelPublishRequest = async () => {
    if (!cancelPublishRequestTagId) return;
    const tagId = cancelPublishRequestTagId;
    try {
      const res = await api.delete(`/tags/${tagId}/publish-request`);
      if (res.data.success) {
        setTags(prev => prev.map(t => t.id === tagId ? res.data.data : t));
      } else {
        setVerifyError(res.data.errorMessage || 'Hủy yêu cầu thất bại.');
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setVerifyError(errorMessage || 'Hủy yêu cầu thất bại.');
    } finally {
      setCancelPublishRequestTagId(null);
    }
  };



  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    if (codeDuplicateRef.current) {
      setFieldErrors(prev => ({ ...prev, newTagCode: 'Code tag đã tồn tại. Hãy đổi code khác hoặc bấm "Dùng tag này".' }));
      return;
    }
    setSaving(true); setFormError('');
    try {
      const payload = {
        name: form.name.trim(), categoryId: form.categoryId, level: form.level,
        description: form.description.trim() || null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : 0,
        tagIds: form.tagIds,
      };
      const res = isEdit
        ? await api.put(`/experts/me/courses/${initialData.id}`, payload)
        : await api.post('/experts/me/courses', payload);
      if (res.data.success) onSaved(res.data.data, isEdit ? 'edit' : 'create');
      else setFormError(res.data.errorMessage || 'Lưu thất bại. Vui lòng thử lại.');
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setFormError(errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.formModal}`}>
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
              <input name="name"
                className={`${styles.formInput} ${fieldErrors.name ? styles.inputError : ''}`}
                value={form.name} onChange={handleChange} placeholder="VD: Machine Learning cơ bản" autoFocus />
              {fieldErrors.name && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.name}</span>}
              <span className={styles.charCount}>{form.name.length}/150</span>
            </div>

            {/* Category + Level */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-tag" /> Danh mục *</label>
                <select name="categoryId"
                  className={`${styles.formSelect} ${fieldErrors.categoryId ? styles.inputError : ''}`}
                  value={form.categoryId} onChange={handleChange}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                {fieldErrors.categoryId && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.categoryId}</span>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-signal" /> Trình độ *</label>
                <select name="level" className={styles.formSelect} value={form.level} onChange={handleChange}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-clock" /> Thời lượng khóa học (giờ)</label>
              <input
                name="durationHours"
                type="number"
                step="0.5"
                min="0"
                max="1000"
                className={`${styles.formInput} ${fieldErrors.durationHours ? styles.inputError : ''}`}
                value={form.durationHours}
                onChange={handleChange}
                placeholder="VD: 15.5"
                style={{ maxWidth: '200px' }}
              />
              {fieldErrors.durationHours && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.durationHours}</span>}
              <small className={styles.fieldHint}>Ước tính tổng thời lượng học (có thể để trống)</small>
            </div>

            {/* Thumbnail */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-image" /> URL ảnh bìa</label>
              <input name="thumbnailUrl"
                className={`${styles.formInput} ${fieldErrors.thumbnailUrl ? styles.inputError : ''}`}
                value={form.thumbnailUrl} onChange={handleChange} placeholder="https://example.com/thumbnail.jpg" />
              {fieldErrors.thumbnailUrl && <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {fieldErrors.thumbnailUrl}</span>}
              {form.thumbnailUrl && !fieldErrors.thumbnailUrl && (
                <div className={styles.thumbPreview}>
                  <img src={form.thumbnailUrl} alt="Preview" onError={e => { e.target.src = FALLBACK_THUMB; }} />
                </div>
              )}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><i className="fas fa-align-left" /> Mô tả khóa học</label>
              <RichTextEditor
                value={form.description}
                onChange={(content) => {
                  setFormError('');
                  clearFieldError('description');
                  setForm((prev) => ({ ...prev, description: content }));
                }}
                placeholder="Mô tả nội dung, mục tiêu, đối tượng học viên..."
              />
              {fieldErrors.description && (
                <span className={styles.fieldError}>
                  <i className="fas fa-exclamation-circle" /> {fieldErrors.description}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className={styles.formGroup}>
              <div className={styles.tagLabelRow}>
                <label className={styles.formLabel}><i className="fas fa-hashtag" /> Kỹ năng / Tags</label>
                <button type="button" className={styles.tagCreateLink}
                  onClick={() => { setShowNewTag(v => !v); setNewTagErrors({}); setNewTagError(''); }}>
                  <i className={`fas ${showNewTag ? 'fa-minus' : 'fa-plus'}`} />
                  {showNewTag ? 'Đóng' : 'Tạo tag mới'}
                </button>
              </div>

              {showNewTag && (
                <div className={styles.inlineTagForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}><i className="fas fa-tag" /> Tên tag *</label>
                      <input className={`${styles.formInput} ${newTagErrors.name ? styles.inputError : ''}`}
                        value={newTagName} onChange={handleNewTagNameChange} placeholder="VD: Machine Learning" maxLength={50} />
                      {newTagErrors.name
                        ? <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {newTagErrors.name}</span>
                        : <span className={styles.charCount}>{newTagName.trim().length}/50</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}><i className="fas fa-code" /> Code tag *</label>
                      <input className={`${styles.formInput} ${styles.codeInput} ${newTagErrors.code ? styles.inputError : ''}`}
                        value={newTagCode} onChange={handleNewTagCodeChange} placeholder="machine-learning" maxLength={50} />
                      {newTagErrors.code
                        ? <span className={styles.fieldError}><i className="fas fa-exclamation-circle" /> {newTagErrors.code}</span>
                        : <span className={styles.charCount}>a-z, 0-9, - · {newTagCode.trim().length}/50</span>}
                    </div>
                  </div>
                  {newTagError && <div className={styles.formError}><i className="fas fa-exclamation-circle" /> {newTagError}</div>}
                  {duplicateTagCandidate && (
                    <div className={styles.duplicateTagActions}>
                      <button type="button" className={styles.btnUseDuplicate} onClick={handleConfirmUseDuplicateTag}>
                        <i className="fas fa-link" /> Dùng tag "{duplicateTagCandidate.name}"
                      </button>
                    </div>
                  )}
                  <div className={styles.inlineTagNote}><i className="fas fa-info-circle" /> Tag mới sẽ ở trạng thái chưa duyệt và được chọn ngay vào khóa học.</div>
                  <button type="button" className={styles.btnInlineCreate} onClick={handleCreateTag} disabled={newTagSaving}>
                    {newTagSaving ? <><span className={styles.spinner} /> Đang tạo...</>
                      : <><i className="fas fa-plus" /> Tạo &amp; chọn tag</>}
                  </button>
                </div>
              )}

              {tagsLoading ? (
                <div className={styles.tagPickerLoading}><span className={styles.spinner} /> Đang tải tags...</div>
              ) : tags.length > 0 ? (
                <div className={styles.tagPicker}>
                  {tags.map(tag => {
                    const status = tag.publishRequest?.status;
                    const isPending = !tag.isPublished && status === 'Pending';
                    const isRejected = !tag.isPublished && status === 'Rejected';
                    const isUnpubNone = !tag.isPublished && !status;
                    const isSelected = form.tagIds.includes(tag.id);
                    const isDuplicate = duplicateTagCandidate?.id === tag.id;
                    let cls = styles.tagBtn;
                    if (isSelected) cls += ` ${styles.tagBtnActive}`;
                    if (isDuplicate) cls += ` ${styles.tagBtnDuplicate}`;
                    else if (isPending) cls += ` ${styles.tagBtnPending}`;
                    else if (isRejected) cls += ` ${styles.tagBtnRejected}`;
                    else if (isUnpubNone) cls += ` ${styles.tagBtnUnpub}`;
                    else if (tag.isFromCourse && !tag.isPublished) cls += ` ${styles.tagBtnFromCourse}`;
                    const titleText = isDuplicate ? 'Tag trùng code với ô nhập — nhấn "Dùng tag này" để thêm'
                      : isPending ? 'Đang chờ admin duyệt (nhấn để chọn / bỏ chọn)'
                        : isRejected ? 'Bị từ chối (nhấn biểu tượng X để gửi lại yêu cầu, nhấn tên tag để chọn/bỏ chọn)'
                          : isUnpubNone ? 'Chưa duyệt (nhấn biểu tượng ! để gửi yêu cầu xét duyệt, nhấn tên tag để chọn/bỏ chọn)'
                            : tag.isFromCourse ? 'Tag từ khóa học (nhấn để chọn/bỏ chọn)'
                              : 'Nhấn để chọn / bỏ chọn tag';
                    return (
                      <div key={tag.id} className={styles.tagBtnWrap}>
                        <button type="button" className={cls} onClick={() => handleTagClick(tag)}
                          title={titleText} aria-disabled={isDuplicate && !isSelected}>
                          {tag.name}
                          {isDuplicate && <span className={styles.tagStatusIcon}><i className="fas fa-link" /></span>}
                          {!isDuplicate && isPending && (
                            <span className={styles.tagStatusIcon} title="Đang chờ admin xét duyệt">
                              <i className="fas fa-clock" />
                            </span>
                          )}
                          {!isDuplicate && isRejected && (
                            <span
                              className={`${styles.tagStatusIcon} ${styles.tagStatusIconClickable}`}
                              onClick={(e) => handleOpenVerifyModal(tag, e)}
                              title="Nhấn vào biểu tượng này để gửi lại yêu cầu xét duyệt cho Admin"
                            >
                              <i className="fas fa-times-circle" />
                            </span>
                          )}
                          {!isDuplicate && isUnpubNone && (
                            <span
                              className={`${styles.tagStatusIcon} ${styles.tagStatusIconClickable}`}
                              onClick={(e) => handleOpenVerifyModal(tag, e)}
                              title="Nhấn vào biểu tượng này để gửi yêu cầu xét duyệt cho Admin"
                            >
                              <i className="fas fa-exclamation-circle" />
                            </span>
                          )}
                        </button>
                        {!isDuplicate && isPending && (
                          <button type="button" className={styles.tagActionBtn}
                            onClick={() => handleDeletePublishRequest(tag.id)} title="Hủy yêu cầu xét duyệt">
                            <i className="fas fa-times" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.tagEmpty}>Chưa có tag nào. Nhấn "Tạo tag mới" để thêm.</p>
              )}
            </div>

            {formError && <div className={styles.formError}><i className="fas fa-exclamation-circle" /> {formError}</div>}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? <><span className={styles.spinner} /> Đang lưu...</>
                : <><i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'}`} /> {isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* Modal gửi / gửi lại yêu cầu xét duyệt tag */}
      {verifyTag && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setVerifyTag(null)}>
          <div className={styles.verifyModal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <i className="fas fa-paper-plane" />
                {verifyTag.publishRequest?.status === 'Rejected' ? ' Gửi lại yêu cầu xét duyệt' : ' Gửi yêu cầu xét duyệt'}
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
              {verifyTag.publishRequest?.status === 'Rejected' && verifyTag.publishRequest?.reviewComment && (
                <div className={styles.infoBoxBlue} style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
                  <i className="fas fa-times-circle" />
                  <span><strong>Lý do từ chối trước đó:</strong> {verifyTag.publishRequest.reviewComment}</span>
                </div>
              )}
              <div className={styles.infoBoxBlue}>
                <i className="fas fa-info-circle" />
                Sau khi được admin duyệt, tag sẽ được công khai.
              </div>

              {/* Show if tag is already selected */}
              {form.tagIds.includes(verifyTag.id) && (
                <div className={styles.infoBoxBlue} style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
                  <i className="fas fa-check-circle" />
                  <span>Tag này đã được chọn trong khóa học của bạn.</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="fas fa-comment-alt" /> Ghi chú cho admin{' '}
                  <span className={styles.labelOptional}>(không bắt buộc)</span>
                </label>
                <textarea className={styles.formTextarea} value={verifyNote}
                  onChange={e => setVerifyNote(e.target.value)}
                  placeholder="Mô tả ngắn về tag này, lý do muốn thêm..." rows={3} />
              </div>
              {verifyError && <div className={styles.formError}><i className="fas fa-exclamation-circle" /> {verifyError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setVerifyTag(null)}>Hủy</button>

              <button className={styles.btnSave} onClick={handleSendVerification} disabled={verifySaving}>
                {verifySaving ? <><span className={styles.spinner} /> Đang gửi...</>
                  : <><i className="fas fa-paper-plane" /> {verifyTag.publishRequest?.status === 'Rejected' ? 'Gửi lại' : 'Gửi yêu cầu'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dùng tag đã tồn tại */}
      {duplicateTagCandidate && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setDuplicateTagCandidate(null)}>
          <div className={styles.verifyModal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}><i className="fas fa-tag" /> Tag đã tồn tại trong hệ thống</div>
              <button className={styles.modalClose} onClick={() => setDuplicateTagCandidate(null)} aria-label="Đóng">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.tagPreviewBox}>
                <span className={styles.tagPreviewName}>{duplicateTagCandidate.name}</span>
                <code className={styles.tagPreviewCode}>{duplicateTagCandidate.code}</code>
              </div>
              <div className={styles.infoBoxBlue}>
                <i className="fas fa-info-circle" />
                Tag này đã tồn tại trong hệ thống. Bạn có muốn thêm tag này vào khóa học không?
              </div>
              {form.tagIds.includes(duplicateTagCandidate.id) && (
                <div className={styles.infoBoxBlue} style={{ marginTop: '8px', background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
                  <i className="fas fa-check-circle" /> Tag này đã được chọn trong khóa học của bạn.
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDuplicateTagCandidate(null)}>Hủy</button>
              <button className={styles.btnSave} onClick={handleConfirmUseDuplicateTag}
                disabled={form.tagIds.includes(duplicateTagCandidate.id)}>
                <i className="fas fa-plus" /> Thêm vào khóa học
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelPublishRequestTagId && (
        <ConfirmModal
          open={!!cancelPublishRequestTagId}
          title="Hủy yêu cầu xét duyệt tag?"
          description="Bạn có chắc muốn hủy yêu cầu xét duyệt này không? Tag sẽ quay về trạng thái chưa gửi duyệt."
          tone="warning"
          confirmLabel="Hủy yêu cầu"
          icon="fa-rotate-left"
          onConfirm={executeCancelPublishRequest}
          onClose={() => setCancelPublishRequestTagId(null)}
        />
      )}
    </div>
  );
}
