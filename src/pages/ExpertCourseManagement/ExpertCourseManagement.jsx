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
function CourseFormModal({ mode, initialData, categories, tags, onClose, onSaved }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name:        initialData?.name        ?? '',
    categoryId:  initialData?.categoryId  ?? '',
    level:       initialData?.level       ?? 'Beginner',
    description: initialData?.description ?? '',
    thumbnailUrl:initialData?.thumbnailUrl ?? '',
    tagIds:      initialData?.tagIds      ?? [],
  });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormError('');
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = tagId => {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim())       { setFormError('Tên khóa học không được để trống.'); return; }
    if (!form.categoryId)        { setFormError('Vui lòng chọn danh mục.'); return; }

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
                className={styles.formInput}
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Machine Learning cơ bản"
                autoFocus
              />
            </div>

            {/* Category + Level row */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><i className="fas fa-tag" /> Danh mục *</label>
                <select name="categoryId" className={styles.formSelect} value={form.categoryId} onChange={handleChange}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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
                className={styles.formInput}
                value={form.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
              {form.thumbnailUrl && (
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
                className={styles.formTextarea}
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả nội dung, mục tiêu, đối tượng học viên..."
              />
            </div>

            {/* Tags */}
            <div className={styles.formGroup}>
              <div className={styles.tagLabelRow}>
                <label className={styles.formLabel}><i className="fas fa-hashtag" /> Kỹ năng / Tags</label>
                <Link
                  to="/expert/tags"
                  target="_blank"
                  className={styles.tagCreateLink}
                  title="Tạo tag mới (mở tab mới)"
                >
                  <i className="fas fa-plus" /> Tạo tag mới
                </Link>
              </div>
              {tags.length > 0 ? (
                <div className={styles.tagPicker}>
                  {tags.map(tag => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`${styles.tagBtn} ${form.tagIds.includes(tag.id) ? styles.tagBtnActive : ''}`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.tagEmpty}>
                  Chưa có tag nào.{' '}
                  <Link to="/expert/tags" target="_blank" className={styles.tagCreateLink}>
                    Tạo tag mới
                  </Link>
                </p>
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
  const [tags,       setTags]       = useState([]);
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

  /* ── load categories & tags once ── */
  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/tags'),
      api.get('/tags/me'),
    ]).then(([catRes, tagRes, myTagRes]) => {
      if (catRes.data.success) setCategories(catRes.data.data ?? []);

      // Gộp published tags + tags của expert (đã duyệt hoặc chưa), tránh trùng id
      const publicTags = tagRes.data.success ? (tagRes.data.data ?? []) : [];
      const myTags     = myTagRes.data.success ? (myTagRes.data.data ?? []) : [];
      const merged     = [...publicTags];
      myTags.forEach(t => {
        if (!merged.find(p => p.id === t.id)) merged.push(t);
      });
      setTags(merged);
    }).catch(() => {});
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
          tags={tags}
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
