import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@services/api';
import styles from './CourseList.module.css';

const LEVELS = [
  { value: 'all',       label: 'Tất cả',        sub: 'Mọi trình độ',       num: 'LEVEL 0' },
  { value: 'Beginner',  label: 'Mới bắt đầu',   sub: 'Chưa biết gì về AI', num: 'LEVEL 1' },
  { value: 'Intermediate', label: 'Trình độ cơ bản',  sub: 'Đã có kinh nghiệm',  num: 'LEVEL 2' },
  { value: 'Advanced',  label: 'Nâng cao',       sub: 'Chuyên sâu',         num: 'LEVEL 3' },
];

const DURATIONS = [
  { value: 'all',    label: 'Thời lượng: Tất cả' },
  { value: 'short',  label: 'Dưới 5 giờ' },
  { value: 'medium', label: 'Từ 5 – 15 giờ' },
  { value: 'long',   label: 'Hơn 15 giờ' },
];

function durCat(h) {
  if (h < 5)  return 'short';
  if (h <= 15) return 'medium';
  return 'long';
}

function LevelBadge({ level }) {
  const map = {
    Beginner:     { label: 'Mới bắt đầu', cls: styles.lvBegin },
    Intermediate: { label: 'Trình độ cơ bản',   cls: styles.lvInter },
    Advanced:     { label: 'Nâng cao',    cls: styles.lvAdv   },
  };
  const info = map[level] ?? { label: level, cls: '' };
  return <span className={`${styles.lvDot} ${info.cls}`} title={info.label} />;
}

function CourseCard({ course, onClick }) {
  const fallback = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

  return (
    <article className={styles.ccard} onClick={() => onClick(course.id)} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(course.id)} role="button" aria-label={course.name}>
      <div className={styles.ccardThumb}>
        <img
          src={course.thumbnailUrl || fallback}
          alt={course.name}
          onError={e => { e.target.src = fallback; }}
          loading="lazy"
        />
        <span className={styles.ccardDur}>{course.durationHours}h</span>
      </div>
      <div className={styles.ccardBody}>
        <span className={styles.ccardCat}>{course.category?.name}</span>
        <h3 className={styles.ccardTitle}>{course.name}</h3>
        <p className={styles.ccardPartner}>
          <i className="fas fa-user-tie" />
          {course.author?.fullName}
        </p>
        <div className={styles.ccardMeta}>
          <LevelBadge level={course.level} />
          <span className={styles.lvTxt}>
            {{ Beginner: 'Mới bắt đầu', Intermediate: 'Trình độ cơ bản', Advanced: 'Nâng cao' }[course.level] ?? course.level}
          </span>
        </div>
        {course.tags?.length > 0 && (
          <div className={styles.ccardTags}>
            {course.tags.slice(0, 3).map(t => (
              <span key={t.id} className={styles.ctag}>{t.name}</span>
            ))}
          </div>
        )}
        <div className={styles.ccardFoot}>
          <button className={styles.enrollBtn} onClick={e => { e.stopPropagation(); onClick(course.id); }}>
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CourseList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses,    setCourses]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [pageIndex,  setPageIndex]  = useState(0);
  const PAGE_SIZE = 12;

  // Filters
  const [keyword,    setKeyword]    = useState(searchParams.get('keyword') || '');
  const [inputVal,   setInputVal]   = useState(searchParams.get('keyword') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [level,      setLevel]      = useState(searchParams.get('level') || 'all');
  const [duration,   setDuration]   = useState('all');

  // Fetch categories once
  useEffect(() => {
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.data ?? []);
    }).catch(() => {});
  }, []);

  // Fetch courses whenever filters change
  const fetchCourses = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = { pageIndex: page, pageSize: PAGE_SIZE };
      if (keyword)    params.keyword    = keyword;
      if (categoryId) params.categoryId = categoryId;
      if (level && level !== 'all') params.level = level;

      const res = await api.get('/courses', { params });
      if (res.data.success) {
        const data = res.data.data;
        setTotal(data.totalItems ?? 0);
        if (page === 0) {
          setCourses(data.items ?? []);
        } else {
          setCourses(prev => [...prev, ...(data.items ?? [])]);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, level]);

  useEffect(() => {
    setPageIndex(0);
    fetchCourses(0);
  }, [fetchCourses]);

  const loadMore = () => {
    const next = pageIndex + 1;
    setPageIndex(next);
    fetchCourses(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(inputVal.trim());
    setPageIndex(0);
  };

  // Filter by duration client-side (API doesn't support it yet)
  const visibleCourses = duration === 'all'
    ? courses
    : courses.filter(c => durCat(c.durationHours) === duration);

  const hasMore = courses.length < total;

  return (
    <div className={styles.page}>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <i className="fas fa-robot" /> Nền tảng học AI hàng đầu Việt Nam
          </div>
          <h1>
            Học <em>AI dễ</em> như ăn cơm
          </h1>
          <p>Từ người mới đến chuyên gia — hàng trăm khóa học AI thực chiến, cập nhật liên tục.</p>

          <form className={styles.heroSearch} onSubmit={handleSearch}>
            <div className={styles.heroSearchInner}>
              <i className={`fas fa-search ${styles.heroSi}`} />
              <input
                type="text"
                placeholder="Tìm khóa học, kỹ năng..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                aria-label="Tìm kiếm khóa học"
              />
            </div>
            <button type="submit" className={styles.heroSearchBtn}>Tìm kiếm</button>
          </form>

          <div className={styles.heroStats}>
            <div className={styles.hstat}><div className={styles.hstatNum}>{total}+</div><div className={styles.hstatLbl}>Khóa học</div></div>
            <div className={styles.hstat}><div className={styles.hstatNum}>10k+</div><div className={styles.hstatLbl}>Học viên</div></div>
            <div className={styles.hstat}><div className={styles.hstatNum}>50+</div><div className={styles.hstatLbl}>Chuyên gia</div></div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ─────────────────────────────────── */}
      {categories.length > 0 && (
        <div className={styles.catSection}>
          <div className="container">
            <h2>Khám phá theo danh mục</h2>
            <div className={styles.catPills}>
              <button
                className={`${styles.catPill} ${!categoryId ? styles.catPillActive : ''}`}
                onClick={() => setCategoryId('')}
              >
                <span className={styles.catPillIcon}>🏠</span> Tất cả
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.catPill} ${categoryId === cat.id ? styles.catPillActive : ''}`}
                  onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                >
                  <span className={styles.catPillIcon}>📚</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN EXPLORE SECTION ────────────────────────────── */}
      <div className={styles.exploreSection}>
        <div className="container">
          {/* Header row */}
          <div className={styles.exploreTop}>
            <h1>
              {keyword ? `Kết quả cho "${keyword}"` : 'Khám phá toàn bộ khóa học'}
            </h1>
            <span className={styles.exploreCount}>{total} khóa học</span>
          </div>

          {/* Level cards */}
          <div className={styles.levelCards}>
            {LEVELS.map(lv => (
              <button
                key={lv.value}
                className={`${styles.levelCard} ${level === lv.value ? styles.levelCardActive : ''}`}
                onClick={() => setLevel(lv.value)}
              >
                <div className={styles.levelNum}>{lv.num}</div>
                <div className={styles.levelName}>{lv.label}</div>
                <div className={styles.levelTag}>{lv.sub}</div>
                <div className={styles.levelDot} />
              </button>
            ))}
          </div>

          {/* Sub-filters */}
          <div className={styles.filterRow}>
            <div className={styles.filterLeft}>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className={styles.filterSel}
                aria-label="Lọc theo thời lượng"
              >
                {DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            {(keyword || categoryId || level !== 'all' || duration !== 'all') && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setKeyword(''); setInputVal('');
                  setCategoryId(''); setLevel('all'); setDuration('all');
                }}
              >
                <i className="fas fa-times" /> Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Grid */}
          {loading && courses.length === 0 ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : visibleCourses.length === 0 ? (
            <div className={styles.noRes}>
              <div className={styles.noResIcon}><i className="fas fa-search" /></div>
              <h3>Không tìm thấy khóa học nào</h3>
              <p>Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
              <button className={styles.clearBtn} onClick={() => {
                setKeyword(''); setInputVal('');
                setCategoryId(''); setLevel('all'); setDuration('all');
              }}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {visibleCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={id => navigate(`/courses/${id}`)}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && duration === 'all' && (
            <div className={styles.showMoreWrap}>
              <button className={styles.showMoreBtn} onClick={loadMore}>
                <i className="fas fa-chevron-down" /> Xem thêm khóa học
              </button>
            </div>
          )}
          {loading && courses.length > 0 && (
            <div className={styles.showMoreWrap}>
              <span className={styles.loadingSpinner} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
