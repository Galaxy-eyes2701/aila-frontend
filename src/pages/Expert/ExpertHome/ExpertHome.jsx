import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './ExpertHome.module.css';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/120';
const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={styles.statCard} style={{ '--accent': color }}>
      <div className={styles.statIcon}>
        <i className={`fas ${icon}`} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Mini Course Card ──────────────────────────────────────────────────────── */
function MiniCourseCard({ course, onManage }) {
  const isPublished = course.isPublished;
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniThumb}>
        <img
          src={course.thumbnailUrl || FALLBACK_THUMB}
          alt={course.name}
          onError={e => { e.target.src = FALLBACK_THUMB; }}
          loading="lazy"
        />
      </div>
      <div className={styles.miniBody}>
        <span className={`${styles.statusPill} ${isPublished ? styles.published : styles.draft}`}>
          <i className={`fas ${isPublished ? 'fa-globe' : 'fa-pencil-alt'}`} />
          {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
        </span>
        <h3 className={styles.miniTitle}>{course.name}</h3>
        <div className={styles.miniMeta}>
          <span><i className="fas fa-layer-group" /> {LEVEL_LABELS[course.level] ?? course.level}</span>
          <span><i className="fas fa-clock" /> {course.durationHours}h</span>
        </div>
        <div className={styles.miniActions}>
          <button className={styles.btnManage} onClick={() => onManage(course.id)}>
            <i className="fas fa-cog" /> Quản lý
          </button>
          {isPublished && (
            <Link to={`/courses/${course.id}`} className={styles.btnView} target="_blank">
              <i className="fas fa-eye" /> Xem
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
function HomeSkeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={`${styles.sk} ${styles.skHero}`} />
      <div className={styles.skStatRow}>
        {[1, 2, 3].map(i => <div key={i} className={`${styles.sk} ${styles.skStat}`} />)}
      </div>
      <div className={`${styles.sk} ${styles.skSection}`} />
      <div className={styles.skCardRow}>
        {[1, 2, 3].map(i => <div key={i} className={`${styles.sk} ${styles.skCard}`} />)}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ExpertHome() {
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get('/experts/me/profile'),
        api.get('/experts/me/courses', { params: { pageIndex: 0, pageSize: 6 } }),
      ]);

      if (profileRes.data.success) setProfile(profileRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data?.items ?? []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login');
      else setError('Không tải được dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className={styles.page}>
      <div className="container"><HomeSkeleton /></div>
    </div>
  );

  if (error) return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-triangle" />
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchData}>
            <i className="fas fa-rotate-right" /> Thử lại
          </button>
        </div>
      </div>
    </div>
  );

  const totalCourses     = courses.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const draftCourses     = courses.filter(c => !c.isPublished).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── HERO GREETING ───────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <p className={styles.heroGreet}>
              <i className="fas fa-hand-wave" /> {greeting()},
            </p>
            <h1 className={styles.heroName}>
              {profile?.fullName ?? 'Chuyên gia'} <span className={styles.waveEmoji}>👋</span>
            </h1>
            {profile?.specialty && (
              <p className={styles.heroSpecialty}>{profile.specialty}</p>
            )}
            <p className={styles.heroSub}>
              Quản lý khóa học, tạo nội dung và theo dõi tiến độ học viên của bạn.
            </p>
            <div className={styles.heroCtaRow}>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate('/expert/courses')}
              >
                <i className="fas fa-list" /> Quản lý khóa học
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate('/expert/courses?action=create')}
              >
                <i className="fas fa-plus" /> Tạo khóa học mới
              </button>
            </div>
          </div>
          <div className={styles.heroRight}>
            <img
              className={styles.heroAvatar}
              src={profile?.avatarUrl || DEFAULT_AVATAR}
              alt={profile?.fullName}
              onError={e => { e.target.src = DEFAULT_AVATAR; }}
            />
          </div>
        </section>

        {/* ── STATS ROW ───────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <StatCard
            icon="fa-book-open"
            label="Tổng khóa học"
            value={totalCourses}
            color="#4f6ef7"
            sub="Của bạn"
          />
          <StatCard
            icon="fa-globe"
            label="Đã xuất bản"
            value={publishedCourses}
            color="#10b981"
            sub="Học viên có thể thấy"
          />
          <StatCard
            icon="fa-pencil-alt"
            label="Bản nháp"
            value={draftCourses}
            color="#f59e0b"
            sub="Chưa công khai"
          />
        </div>

        {/* ── RECENT COURSES ──────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clock-rotate-left" /> Khóa học gần đây
            </h2>
            <Link to="/expert/courses" className={styles.seeAll}>
              Xem tất cả <i className="fas fa-arrow-right" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><i className="fas fa-book-open" /></div>
              <h3>Bạn chưa có khóa học nào</h3>
              <p>Bắt đầu tạo khóa học đầu tiên và chia sẻ kiến thức của bạn.</p>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate('/expert/courses?action=create')}
              >
                <i className="fas fa-plus" /> Tạo khóa học đầu tiên
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map(course => (
                <MiniCourseCard
                  key={course.id}
                  course={course}
                  onManage={id => navigate(`/expert/courses/${id}/modules`)}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
