import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@services/api';
import { getExpertDashboard } from "@services/expertDashboardApi";
import styles from './ExpertHome.module.css';

import { DEFAULT_AVATAR } from '@infrastructure/constants/defaultAvatar';
const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

const REPORTING_PERIOD_OPTIONS = [
  { value: 'Last7Days', label: '7 ngày qua' },
  { value: 'Last30Days', label: '30 ngày qua (Mặc định)' },
  { value: 'Last90Days', label: '90 ngày qua' },
  { value: 'ThisYear', label: 'Năm nay' },
  { value: 'CustomRange', label: 'Tùy chỉnh khoảng ngày' },
];

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}15` }}>
        <i className={`fas ${icon}`} style={{ color: color }} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</div>
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
      <div className={`${styles.sk} ${styles.skFilter}`} />
      <div className={styles.skStatRow}>
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`${styles.sk} ${styles.skStat}`} />)}
      </div>
      <div className={`${styles.sk} ${styles.skSection}`} />
    </div>
  );
}

/* ── Main Page Component ───────────────────────────────────────────────────── */
export default function ExpertHome() {
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [courses, setCourses]         = useState([]);
  const [dashboard, setDashboard]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [dashLoading, setDashLoading] = useState(false);
  const [error, setError]             = useState('');

  // UC-65 Filter Scope state
  const [courseId, setCourseId]               = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('Last30Days');
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [scopeError, setScopeError]           = useState('');

  // 1. Fetch initial profile & courses list
  const fetchProfileAndCourses = useCallback(async () => {
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get('/experts/me/profile'),
        api.get('/experts/me/courses', { params: { pageIndex: 0, pageSize: 6 } }),
      ]);

      if (profileRes.data.success) setProfile(profileRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data?.items ?? []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login');
      else setError('Không tải được thông tin cá nhân. Vui lòng thử lại.');
    }
  }, [navigate]);

  // 2. Fetch UC-65 Dashboard Analytics data
  const fetchDashboardData = useCallback(async () => {
    // Validate scope trước khi gọi API (AF-03)
    if (reportingPeriod === 'CustomRange') {
      if (!startDate || !endDate) {
        setScopeError('Khoảng thời gian tùy chỉnh phải bao gồm cả ngày bắt đầu và ngày kết thúc.');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setScopeError('Ngày bắt đầu không được sau ngày kết thúc (BR-03).');
        return;
      }
    }

    setScopeError('');
    setDashLoading(true);

    try {
      const res = await getExpertDashboard({
        courseId: courseId || null,
        reportingPeriod,
        startDate: reportingPeriod === 'CustomRange' ? startDate : null,
        endDate: reportingPeriod === 'CustomRange' ? endDate : null,
      });

      if (res.success) {
        setDashboard(res.data);
      } else {
        setScopeError(res.errorMessage || 'Phạm vi báo cáo không hợp lệ.');
      }
    } catch (err) {
      setScopeError('Không thể tải dữ liệu phân tích bảng điều khiển.');
    } finally {
      setDashLoading(false);
    }
  }, [courseId, reportingPeriod, startDate, endDate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfileAndCourses();
      setLoading(false);
    };
    init();
  }, [fetchProfileAndCourses]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
          <button className={styles.retryBtn} onClick={fetchProfileAndCourses}>
            <i className="fas fa-rotate-right" /> Thử lại
          </button>
        </div>
      </div>
    </div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const overview = dashboard?.overview || {};
  const trends = dashboard?.trends || [];
  const coursePerformances = dashboard?.coursePerformances || [];
  const availableCourses = dashboard?.availableCourses || [];

  // Determine max trend value for scaling chart
  const maxTrendValue = Math.max(
    1,
    ...trends.map(t => Math.max(t.enrollments, t.activeLearners))
  );

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
              Bảng điều khiển tổng quan hiệu suất & mức độ tương tác của học viên.
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

        {/* ── SCOPE CONTROL TOOLBAR ─────────────────────── */}
        <div className={styles.filterCard}>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitle}>
              <i className="fas fa-sliders" /> Phạm vi báo cáo
            </div>
            {dashLoading && (
              <span className={styles.statSub}>
                <i className="fas fa-spinner fa-spin" /> Đang tổng hợp dữ liệu...
              </span>
            )}
          </div>

          <div className={styles.filterRow}>
            {/* Filtering by Course */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Khóa học</label>
              <select
                className={styles.filterSelect}
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
              >
                <option value="">Tất cả khóa học đã xuất bản ({availableCourses.length})</option>
                {availableCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filtering by Reporting Period */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Khoảng thời gian</label>
              <select
                className={styles.filterSelect}
                value={reportingPeriod}
                onChange={e => setReportingPeriod(e.target.value)}
              >
                {REPORTING_PERIOD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Date Pickers (Shown if CustomRange) */}
            {reportingPeriod === 'CustomRange' && (
              <>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Từ ngày</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Đến ngày</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Scope Validation Error Callout */}
          {scopeError && (
            <div className={styles.scopeError} role="alert">
              <i className="fas fa-circle-exclamation" /> {scopeError}
            </div>
          )}
        </div>

        {/* ── NO PUBLISHED COURSES STATE ────────────────── */}
        {dashboard && !dashboard.hasPublishedCourses && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><i className="fas fa-book-bookmark" /></div>
            <h3>{dashboard.message || "Bạn chưa có khóa học nào được xuất bản."}</h3>
            <p>Sau khi xuất bản khóa học, số liệu phân tích hiệu suất và lượt tương tác học viên sẽ hiển thị tại đây.</p>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate('/expert/courses')}
            >
              <i className="fas fa-arrow-right" /> Đến danh sách khóa học
            </button>
          </div>
        )}

        {/* ── NO ANALYTICS DATA CALLOUT ─────────────────── */}
        {dashboard && dashboard.hasPublishedCourses && !dashboard.hasData && (
          <div className={styles.noDataCallout} role="status">
            <i className="fas fa-circle-info" />
            <span>{dashboard.message || "Không có dữ liệu thống kê trong khoảng thời gian đã chọn."}</span>
          </div>
        )}

        {/* ── AGGREGATED STATS GRID ────────────── */}
        {dashboard && dashboard.hasPublishedCourses && (
          <>
            <div className={styles.statsGrid}>
              <StatCard
                icon="fa-globe"
                label="Khóa học xuất bản"
                value={overview.totalPublishedCourses ?? 0}
                color="#6366f1"
                sub="Khóa học đang hoạt động"
              />
              <StatCard
                icon="fa-users"
                label="Tổng Lượt Đăng Ký"
                value={overview.totalEnrollments ?? 0}
                color="#3b82f6"
                sub="Học viên ghi danh"
              />
              <StatCard
                icon="fa-user-clock"
                label="Học Viên Tương Tác"
                value={overview.totalActiveLearners ?? 0}
                color="#10b981"
                sub="Học viên tương tác"
              />
              <StatCard
                icon="fa-chart-line"
                label="Tỷ Lệ Hoàn Thành"
                value={`${overview.averageCompletionRate ?? 0}%`}
                color="#8b5cf6"
                sub={`${overview.completedEnrollmentsCount ?? 0} lượt hoàn thành`}
              />
              <StatCard
                icon="fa-clipboard-check"
                label="Lượt Làm Quiz"
                value={overview.totalQuizAttempts ?? 0}
                color="#f59e0b"
                sub="Bài kiểm tra đã làm"
              />
              <StatCard
                icon="fa-robot"
                label="Thực Hành AI"
                value={overview.totalPracticeAttempts ?? 0}
                color="#ec4899"
                sub="Lượt luyện kịch bản AI"
              />
            </div>

            {/* ── TRENDS CHART (ANALYTICS VISUALIZATION) ──────── */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-chart-column" /> Xu hướng tương tác
                </h3>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}>
                    <span className={`${styles.legendDot}`} style={{ background: '#4f46e5' }} /> Đăng ký mới
                  </span>
                  <span className={styles.legendItem}>
                    <span className={`${styles.legendDot}`} style={{ background: '#10b981' }} /> Học viên hoạt động
                  </span>
                </div>
              </div>

              {trends.length > 0 ? (
                <div className={styles.chartBarsContainer}>
                  {trends.map((point, index) => {
                    const enrollHeight = (point.enrollments / maxTrendValue) * 100;
                    const activeHeight = (point.activeLearners / maxTrendValue) * 100;
                    return (
                      <div key={index} className={styles.chartBarGroup} title={`${point.dateLabel}: ${point.enrollments} đăng ký, ${point.activeLearners} hoạt động`}>
                        <div className={styles.barTrack}>
                          <div
                            className={`${styles.barPill} ${styles.barEnrollment}`}
                            style={{ height: `${Math.max(4, enrollHeight)}%` }}
                          />
                          <div
                            className={`${styles.barPill} ${styles.barActiveLearner}`}
                            style={{ height: `${Math.max(4, activeHeight)}%` }}
                          />
                        </div>
                        <span className={styles.chartLabel}>{point.dateLabel}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.statSub} style={{ textAlign: 'center', padding: '40px 0' }}>
                  Chưa có dữ liệu xu hướng trong khoảng thời gian này.
                </p>
              )}
            </div>

            {/* ── COURSE PERFORMANCE BREAKDOWN ────────────────── */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-table-list" /> Hiệu suất theo khóa học
                </h3>
              </div>

              {coursePerformances.length > 0 ? (
                <table className={styles.performanceTable}>
                  <thead>
                    <tr>
                      <th>Tên Khóa Học</th>
                      <th>Lượt Ghi Danh</th>
                      <th>Tỷ Lệ Hoàn Thành Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursePerformances.map(item => (
                      <tr key={item.courseId}>
                        <td><strong>{item.courseName}</strong></td>
                        <td>{item.totalEnrollments.toLocaleString('vi-VN')} học viên</td>
                        <td>
                          <div className={styles.courseProgressTrack}>
                            <div
                              className={styles.courseProgressBar}
                              style={{ width: `${Math.min(100, item.completionRate)}%` }}
                            />
                          </div>
                          <span>{item.completionRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.statSub} style={{ textAlign: 'center', padding: '20px 0' }}>
                  Không có khóa học nào trong danh sách.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── RECENT COURSES SECTION ──────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-clock-rotate-left" /> Danh sách khóa học gần đây
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
