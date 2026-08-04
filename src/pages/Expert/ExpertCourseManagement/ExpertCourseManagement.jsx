import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './ExpertCourseManagement.module.css';
import CoursePreviewModal from '../../../components/CoursePreviewModal/CoursePreviewModal';
import Toast             from './components/Toast';
import ConfirmDialog     from './components/ConfirmDialog';
import CourseRow         from './components/CourseRow';
import CourseFormModal   from './components/CourseFormModal';
import CourseReReviewModal from './components/CourseReReviewModal';

export default function ExpertCourseManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses,    setCourses]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [pageIndex,  setPageIndex]  = useState(0);
  const PAGE_SIZE = 10;

  const [keyword,      setKeyword]      = useState('');
  const [inputVal,     setInputVal]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showForm,        setShowForm]        = useState(searchParams.get('action') === 'create');
  const [editingCourse,   setEditingCourse]   = useState(null);
  const [confirm,         setConfirm]         = useState(null);
  const [previewCourseId, setPreviewCourseId] = useState(null);
  const [reReviewCourse,  setReReviewCourse]  = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    api.get('/categories')
      .then(res => { if (res.data.success) setCategories(res.data.data ?? []); })
      .catch(() => {});
  }, []);

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
    } finally { setLoading(false); }
  }, [keyword, filterStatus, navigate]);

  useEffect(() => { setPageIndex(0); fetchCourses(0); }, [fetchCourses]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowForm(true); setEditingCourse(null); setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSearch = e => { e.preventDefault(); setKeyword(inputVal.trim()); setPageIndex(0); };

  const handleFormSaved = (result, mode) => {
    setShowForm(false); setEditingCourse(null);
    showToast(mode === 'create' ? 'Tạo khóa học thành công!' : 'Cập nhật khóa học thành công!');
    fetchCourses(0);
  };

  const handleEdit = course => {
    if (course.isPublished) {
      showToast('Hãy ẩn khóa học trước khi chỉnh sửa.', 'error');
      return;
    }
    setEditingCourse({
      id: course.id, name: course.name,
      categoryId: course.category?.id ?? '', level: course.level,
      description: course.description ?? '', thumbnailUrl: course.thumbnailUrl ?? '',
      tagIds: course.tags?.map(t => t.id) ?? [],
    });
    setShowForm(true);
  };

  const handlePublish = useCallback(async courseId => {
    try {
      const res = await api.patch(`/experts/me/courses/${courseId}/publish`);
      if (res.data.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPublished: true } : c));
        showToast('Khóa học đã được xuất bản thành công!');
      } else { showToast(res.data.errorMessage || 'Xuất bản thất bại.', 'error'); }
    } catch (err) { showToast(err.response?.data?.errorMessage || 'Xuất bản thất bại.', 'error'); }
  }, []);

  const handleUnpublish = useCallback(courseId => {
    const course = courses.find(c => c.id === courseId);
    setConfirm({ type: 'unpublish', courseId, courseName: course?.name });
  }, [courses]);

  const confirmUnpublish = async () => {
    const { courseId } = confirm; setConfirm(null);
    try {
      const res = await api.patch(`/experts/me/courses/${courseId}/unpublish`);
      if (res.data.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPublished: false } : c));
        showToast('Khóa học đã được chuyển về bản nháp.');
      } else { showToast(res.data.errorMessage || 'Hủy xuất bản thất bại.', 'error'); }
    } catch (err) { showToast(err.response?.data?.errorMessage || 'Hủy xuất bản thất bại.', 'error'); }
  };

  const loadMore = () => { const next = pageIndex + 1; setPageIndex(next); fetchCourses(next); };

  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount     = courses.filter(c => !c.isPublished).length;
  const hasMore        = courses.length < total;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* HEADER */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.breadcrumb}>
              <Link to="/expert">Trang chủ</Link>
              <i className="fas fa-chevron-right" />
              <span>Quản lý khóa học</span>
            </div>
            <h1 className={styles.pageTitle}><i className="fas fa-graduation-cap" /> Quản lý khóa học</h1>
            <p className={styles.pageSubtitle}>Tạo, chỉnh sửa và quản lý tất cả khóa học của bạn.</p>
          </div>
          <button className={styles.btnCreate} onClick={() => { setEditingCourse(null); setShowForm(true); }}>
            <i className="fas fa-plus" /> Tạo khóa học mới
          </button>
        </div>

        {/* STATS */}
        <div className={styles.statsBar}>
          <div className={styles.statChip}><span className={styles.statChipNum}>{total}</span><span className={styles.statChipLbl}>Tổng</span></div>
          <div className={`${styles.statChip} ${styles.statChipGreen}`}><span className={styles.statChipNum}>{publishedCount}</span><span className={styles.statChipLbl}>Đã xuất bản</span></div>
          <div className={`${styles.statChip} ${styles.statChipYellow}`}><span className={styles.statChipNum}>{draftCount}</span><span className={styles.statChipLbl}>Bản nháp</span></div>
        </div>

        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchWrap}>
              <i className="fas fa-search" />
              <input type="text" placeholder="Tìm theo tên khóa học..." value={inputVal}
                onChange={e => setInputVal(e.target.value)} aria-label="Tìm kiếm" />
            </div>
            <button type="submit" className={styles.btnSearch}>Tìm</button>
          </form>
          <div className={styles.filterTabs}>
            {[{ value: 'all', label: 'Tất cả' }, { value: 'published', label: 'Đã xuất bản' }, { value: 'draft', label: 'Bản nháp' }].map(tab => (
              <button key={tab.value}
                className={`${styles.filterTab} ${filterStatus === tab.value ? styles.filterTabActive : ''}`}
                onClick={() => { setFilterStatus(tab.value); setPageIndex(0); }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* COURSE LIST */}
        {loading && courses.length === 0 ? (
          <div className={styles.loadingWrap}>{[1,2,3].map(i => <div key={i} className={styles.skRow} />)}</div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><i className="fas fa-book-open" /></div>
            <h3>{keyword || filterStatus !== 'all' ? 'Không tìm thấy khóa học nào' : 'Bạn chưa có khóa học nào'}</h3>
            <p>{keyword || filterStatus !== 'all' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Bắt đầu tạo khóa học đầu tiên và chia sẻ kiến thức của bạn.'}</p>
            {!keyword && filterStatus === 'all' && (
              <button className={styles.btnCreate} onClick={() => { setEditingCourse(null); setShowForm(true); }}>
                <i className="fas fa-plus" /> Tạo khóa học đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className={styles.courseList}>
            {courses.map(course => (
              <CourseRow key={course.id} course={course}
                onEdit={handleEdit} onPublish={handlePublish}
                onUnpublish={handleUnpublish} onPreview={setPreviewCourseId}
                onReReview={setReReviewCourse}
                onLockedPublish={() => showToast(
                  'Khóa học đang bị khoá do vi phạm nội quy. Vui lòng nhấn "Yêu cầu mở lại" để gửi yêu cầu xem xét.',
                  'error'
                )} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className={styles.loadMoreWrap}>
            <button className={styles.btnLoadMore} onClick={loadMore}><i className="fas fa-chevron-down" /> Xem thêm</button>
          </div>
        )}
        {loading && courses.length > 0 && <div className={styles.loadMoreWrap}><span className={styles.spinner} /></div>}
      </div>

      {showForm && (
        <CourseFormModal mode={editingCourse ? 'edit' : 'create'} initialData={editingCourse}
          categories={categories} onClose={() => { setShowForm(false); setEditingCourse(null); }}
          onSaved={handleFormSaved} />
      )}

      {confirm?.type === 'unpublish' && (
        <ConfirmDialog
          title="Hủy xuất bản khóa học?"
          message={`Khóa học "${confirm.courseName}" sẽ bị ẩn khỏi danh sách công khai và học viên mới không thể đăng ký. Học viên đã đăng ký vẫn có thể truy cập.`}
          confirmLabel="Hủy xuất bản" danger
          onConfirm={confirmUnpublish} onCancel={() => setConfirm(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {previewCourseId && <CoursePreviewModal courseId={previewCourseId} onClose={() => setPreviewCourseId(null)} />}

      {reReviewCourse && (
        <CourseReReviewModal course={reReviewCourse}
          onClose={() => setReReviewCourse(null)}
          onSubmitted={() => {
            setReReviewCourse(null);
            showToast('Đã gửi yêu cầu xem xét lại. Admin sẽ phản hồi sớm nhất có thể.');
          }} />
      )}
    </div>
  );
}
