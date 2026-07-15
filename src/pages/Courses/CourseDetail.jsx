import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import LoginModal    from '../../components/AuthModals/LoginModal';
import RegisterModal from '../../components/AuthModals/RegisterModal';
import ReportCourseModal from '../Report/ReportCourseModal';
import styles from './CourseDetail.module.css';

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=75';
const DEFAULT_AVATAR  = 'https://i.pravatar.cc/80';

/** Accordion module item */
function ModuleItem({ module, index, initialOpen }) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className={styles.moduleItem}>
      <button
        className={`${styles.moduleToggle} ${open ? styles.open : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className={styles.modInfo}>
          <span className={styles.modNum}>MODULE {String(index + 1).padStart(2, '0')}</span>
          <span className={styles.modTitle}>{module.title}</span>
        </div>
        <div className={styles.modRight}>
          <span className={styles.modMeta}>{module.materials.length} bài</span>
          <i className={`fas fa-chevron-down ${styles.chevron}`} />
        </div>
      </button>
      {open && (
        <ul className={styles.lessonList} role="list">
          {module.materials.map(mat => (
            <li key={mat.id} className={styles.lessonItem}>
              <i className={`fas ${mat.materialType === 'Video' ? 'fa-play-circle' : 'fa-file-alt'} ${styles.lessonIcon}`} />
              <span className={styles.lessonTitle}>{mat.title}</span>
              <span className={styles.lessonType}>{mat.materialType === 'Video' ? 'Video' : 'Tài liệu'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sidebarRef = useRef(null);

  const [course,           setCourse]           = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [enrolling,        setEnrolling]        = useState(false);
  const [error,            setError]            = useState('');
  const [stickyVisible,    setStickyVisible]    = useState(false);

  // null = đang check API, true = đã enroll, false = chưa enroll
  const [enrolled,         setEnrolled]         = useState(false);
  const [learningProgress, setLearningProgress] = useState(null);

  // Auth modal: null | 'login' | 'register'
  const [authModal, setAuthModal] = useState(null);

  // Báo cáo khóa học
  const [showReport, setShowReport] = useState(false);
  const [reportToast, setReportToast] = useState(false);

  useEffect(() => {
    if (!reportToast) return undefined;
    const t = setTimeout(() => setReportToast(false), 3000);
    return () => clearTimeout(t);
  }, [reportToast]);

  // Load course detail
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/courses/${id}`)
      .then(res => {
        if (res.data.success) setCourse(res.data.data);
        else setError('Không tìm thấy khóa học.');
      })
      .catch(() => setError('Không tải được khóa học. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Kiểm tra enrollment từ DB qua endpoint riêng
  useEffect(() => {
    if (!user || user.role !== 'Learner') {
      setEnrolled(false);
      setLearningProgress(null);
      return;
    }
    // Đặt null để hiện spinner trong lúc check
    setEnrolled(null);
    api.get(`/courses/${id}/enrollment`)
      .then(res => {
        if (res.data.success && res.data.data?.isEnrolled) {
          setEnrolled(true);
          // Lấy thêm progress nếu đã enrolled
          return api.get(`/courses/${id}/learning-view`)
            .then(lv => {
              if (lv.data.success) setLearningProgress(lv.data.data?.progress ?? null);
            })
            .catch(() => {});
        } else {
          setEnrolled(false);
        }
      })
      .catch(() => {
        setEnrolled(false);
        setLearningProgress(null);
      });
  }, [user, id]);

  // Sticky tabs
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleEnroll = async () => {
    if (!user) { setAuthModal('login'); return; }
    setEnrolling(true);
    try {
      const res = await api.post(`/courses/${id}/enroll`);
      if (res.data.success) {
        setEnrolled(true);
        // Lấy luôn progress sau khi enroll
        const lv = await api.get(`/courses/${id}/learning-view`);
        if (lv.data.success) setLearningProgress(lv.data.data?.progress ?? null);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.errorMessage;
      if (status === 401) { setAuthModal('login'); return; }
      if (status === 403) {
        alert('Chức năng này chỉ dành cho học viên. Vui lòng đăng nhập bằng tài khoản học viên.');
        return;
      }
      alert(msg ?? 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleGoToLearning = () => navigate(`/learning/${id}`);

  // Render nút action tùy trạng thái enrollment
  const renderAction = (size = 'normal') => {
    const sm = size === 'small';

    // Đang check enrollment — skeleton nhỏ
    if (enrolled === null) {
      return (
        <div className={sm ? styles.btnEnrollSm : styles.btnEnroll}
          style={{ opacity: 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <span className={styles.spinner} />
        </div>
      );
    }

    if (enrolled) {
      const label = (learningProgress?.percent ?? 0) > 0
        ? `Tiếp tục học (${Math.round(learningProgress.percent)}%)`
        : 'Bắt đầu học';
      const icon = (learningProgress?.percent ?? 0) > 0 ? 'fa-play' : 'fa-graduation-cap';
      return (
        <button className={sm ? styles.btnLearnSm : styles.btnLearn} onClick={handleGoToLearning}>
          <i className={`fas ${icon}`} /> {label}
        </button>
      );
    }

    return (
      <button
        className={sm ? styles.btnEnrollSm : styles.btnEnroll}
        onClick={handleEnroll}
        disabled={enrolling}
      >
        {enrolling
          ? <><span className={styles.spinner} /> Đang xử lý...</>
          : <><i className="fas fa-graduation-cap" /> Đăng ký học ngay</>}
      </button>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Đang tải khóa học...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.errorPage}>
        <i className="fas fa-exclamation-triangle" />
        <h2>{error || 'Không tìm thấy khóa học.'}</h2>
        <button className={styles.backBtn} onClick={() => navigate('/courses')}>
          <i className="fas fa-arrow-left" /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const totalMaterials  = course.modules.reduce((s, m) => s + m.materials.length, 0);
  const progressPercent = learningProgress ? Math.round(learningProgress.percent) : 0;

  return (
    <div className={styles.page}>

      {/* ── STICKY SECONDARY TABS ─────────────────────────── */}
      <div className={`${styles.stickyTabs} ${stickyVisible ? styles.stickyVisible : ''}`}>
        <div className={styles.stickyTabsInner}>
          <a href="#learn"      className={styles.stickyTab}>Học gì</a>
          <a href="#curriculum" className={styles.stickyTab}>Nội dung</a>
          <a href="#instructor" className={styles.stickyTab}>Giảng viên</a>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link to="/courses">Trang chủ</Link>
            <span className={styles.bcSep}>›</span>
            <Link to="/courses">{course.category?.name}</Link>
            <span className={styles.bcSep}>›</span>
            <span>{course.name}</span>
          </nav>

          <h1 className={styles.heroTitle}>{course.name}</h1>
          {course.description && <p className={styles.heroSubtitle}>{course.description}</p>}

          <div className={styles.heroAuthor}>
            Tạo bởi{' '}
            <Link to={`/experts/${course.author?.userId}`} className={styles.heroAuthorLink}>
              {course.author?.fullName}
            </Link>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}><i className="fas fa-layer-group" />{LEVEL_LABELS[course.level] ?? course.level}</span>
            <span className={styles.metaItem}><i className="fas fa-clock" />{course.durationHours}h học</span>
            <span className={styles.metaItem}><i className="fas fa-book-open" />{course.totalModules} module · {course.totalMaterials} bài học</span>
            <span className={styles.metaItem}><i className="fas fa-tag" />{course.category?.name}</span>
          </div>
        </div>
      </section>

      {/* ── PAGE BODY ─────────────────────────────────────── */}
      <div className={styles.pageWrapper}>

        {/* ══ CONTENT COLUMN ══ */}
        <div className={styles.contentCol}>

          {/* WHAT YOU'LL LEARN */}
          <section className={styles.sectionCard} id="learn">
            <h2 className={styles.sectionTitle}>Bạn sẽ học được gì</h2>
            <div className={styles.learnGrid}>
              {course.tags?.length > 0 ? (
                course.tags.map(tag => (
                  <div key={tag.id} className={styles.learnItem}>
                    <i className="fas fa-check" /><span>{tag.name}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className={styles.learnItem}><i className="fas fa-check" /><span>Nắm vững kiến thức nền tảng trong lĩnh vực này</span></div>
                  <div className={styles.learnItem}><i className="fas fa-check" /><span>Áp dụng thực tế vào công việc và dự án</span></div>
                  <div className={styles.learnItem}><i className="fas fa-check" /><span>Xây dựng portfolio cá nhân nổi bật</span></div>
                  <div className={styles.learnItem}><i className="fas fa-check" /><span>Học từ những chuyên gia đầu ngành</span></div>
                </>
              )}
            </div>
          </section>

          {/* SKILL TAGS */}
          {course.tags?.length > 0 && (
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-bolt" style={{ color: '#f59e0b', marginRight: 8 }} />
                Kỹ năng đạt được
              </h2>
              <div className={styles.skillTags}>
                {course.tags.map(tag => (
                  <Link key={tag.id} to={`/courses?keyword=${tag.name}`} className={styles.skillTag}>
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CURRICULUM */}
          <section className={styles.sectionCard} id="curriculum">
            <div className={styles.curriculumHeader}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Nội dung khóa học</h2>
              <span className={styles.curriculumMeta}>
                {course.totalModules} module · {totalMaterials} bài học · {course.durationHours}h
              </span>
            </div>
            {course.modules.length > 0 ? (
              <div className={styles.moduleAccordion}>
                {course.modules.map((mod, i) => (
                  <ModuleItem key={mod.id} module={mod} index={i} initialOpen={i === 0} />
                ))}
              </div>
            ) : (
              <p className={styles.emptyNote}>Nội dung khóa học đang được cập nhật.</p>
            )}
          </section>

          {/* INSTRUCTOR */}
          <section className={styles.sectionCard} id="instructor">
            <h2 className={styles.sectionTitle}>Giảng viên</h2>
            <div className={styles.instructorCard}>
              <Link to={`/experts/${course.author?.userId}`}>
                <img
                  src={course.author?.avatarUrl || DEFAULT_AVATAR}
                  alt={course.author?.fullName}
                  className={styles.instructorAvatar}
                  onError={e => { e.target.src = DEFAULT_AVATAR; }}
                />
              </Link>
              <div className={styles.instructorInfo}>
                <Link to={`/experts/${course.author?.userId}`} className={styles.instructorName}>
                  {course.author?.fullName}
                </Link>
                <div className={styles.instructorHeadline}>{course.author?.specialty}</div>
                <div className={styles.instructorStats}>
                  {course.author?.yearsOfExperience > 0 && (
                    <span className={styles.instructorStat}>
                      <i className="fas fa-briefcase" />
                      <strong>{course.author.yearsOfExperience}</strong> năm kinh nghiệm
                    </span>
                  )}
                </div>
                {course.author?.bio && (
                  <p className={styles.instructorBio}>{course.author.bio}</p>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* ══ SIDEBAR ══ */}
        <aside className={styles.sidebarCol} ref={sidebarRef}>
          <div className={styles.enrollCard}>
            <div className={styles.thumbWrap}>
              <div className={styles.thumbWrapInner}>
                <img
                  src={course.thumbnailUrl || FALLBACK_THUMB}
                  alt={course.name}
                  onError={e => { e.target.src = FALLBACK_THUMB; }}
                />
                <div className={styles.playOverlay}>
                  <i className="fas fa-play-circle" />
                </div>
              </div>
            </div>

            <div className={styles.enrollBody}>
              <div className={styles.priceRow}>
                <span className={styles.priceFree}>Miễn phí</span>
              </div>

              {/* Progress bar — chỉ hiện khi đã enrolled và có tiến độ */}
              {enrolled && learningProgress && learningProgress.totalMaterials > 0 && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className={styles.progressLabel}>
                    {progressPercent}% hoàn thành · {learningProgress.completedMaterials}/{learningProgress.totalMaterials} bài
                  </span>
                </div>
              )}

              {renderAction('normal')}

              <ul className={styles.includesList}>
                <li><i className="fas fa-clock" /> {course.durationHours}h nội dung học</li>
                <li><i className="fas fa-infinity" /> Truy cập trọn đời</li>
                <li><i className="fas fa-book-open" /> {totalMaterials} bài học</li>
                <li><i className="fas fa-layer-group" /> {course.totalModules} module</li>
                <li><i className="fas fa-mobile-alt" /> Học trên mọi thiết bị</li>
              </ul>
            </div>
          </div>

          {/* Info card */}
          <div className={styles.infoCard}>
            <h3>Thông tin khóa học</h3>
            <ul className={styles.infoList}>
              <li>
                <i className="fas fa-signal" />
                <span>Trình độ: <strong>{LEVEL_LABELS[course.level] ?? course.level}</strong></span>
              </li>
              <li>
                <i className="fas fa-tag" />
                <span>Danh mục: <strong>{course.category?.name}</strong></span>
              </li>
              {course.tags?.length > 0 && (
                <li>
                  <i className="fas fa-hashtag" />
                  <span>Chủ đề: <strong>{course.tags.map(t => t.name).join(', ')}</strong></span>
                </li>
              )}
            </ul>

            {/* Báo cáo khóa học — chỉ hiện khi đã đăng ký học */}
            {enrolled === true && (
              <button
                type="button"
                className={styles.reportCourseBtn}
                onClick={() => setShowReport(true)}
              >
                <i className="fas fa-flag" /> Báo cáo khóa học
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* ── MOBILE ENROLL BAR ──────────────────────────────── */}
      <div className={styles.enrollBar}>
        <div className={styles.enrollBarLeft}>
          <span className={styles.priceFree}>Miễn phí</span>
          <span className={styles.enrollBarTitle}>{course.name}</span>
        </div>
        {renderAction('small')}
      </div>

      {/* ── AUTH MODALS ─────────────────────────────────────── */}
      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
          onLoginSuccess={() => setAuthModal(null)}
        />
      )}
      {authModal === 'register' && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
          onRegisterSuccess={() => setAuthModal(null)}
        />
      )}

      {/* ── REPORT MODAL (cấp khóa học — không kèm materialId) ── */}
      {showReport && (
        <ReportCourseModal
          courseId={id}
          courseName={course.name}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false);
            setReportToast(true);
          }}
        />
      )}

      {reportToast && (
        <div className={styles.reportToast}>
          <i className="fas fa-circle-check" /> Đã gửi báo cáo. Cảm ơn bạn đã đóng góp!
        </div>
      )}
    </div>
  );
}
