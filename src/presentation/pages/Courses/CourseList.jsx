import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@services/api';
import useAuth from '@state/hooks/useAuth';
import styles from './CourseList.module.css';

const LEVELS = [
  { value: 'all', label: 'Tất cả', sub: 'Mọi trình độ', num: 'CẤP ĐỘ 0' },
  { value: 'Beginner', label: 'Mới bắt đầu', sub: 'Chưa biết gì về AI', num: 'CẤP ĐỘ 1' },
  { value: 'Intermediate', label: 'Cơ bản', sub: 'Đã có kinh nghiệm', num: 'CẤP ĐỘ 2' },
  { value: 'Advanced', label: 'Nâng cao', sub: 'Chuyên sâu', num: 'CẤP ĐỘ 3' },
];

const LEVEL_MAP = { Beginner: 'Mới bắt đầu', Intermediate: 'Trung cấp', Advanced: 'Nâng cao' };

function RecommendCard({ course, onClick }) {
  const fallback = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';
  const courseId = course.courseId || course.id;
  return (
    <article
      className={styles.recCard}
      onClick={() => onClick(courseId)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(courseId)}
      role="button"
      aria-label={course.name}
    >
      <div className={styles.recThumb}>
        <img
          src={course.thumbnailUrl || fallback}
          alt={course.name}
          onError={e => { e.target.src = fallback; }}
          loading="lazy"
        />
        {course.recommendationScore > 0 && (
          <span className={styles.recScoreBadge}>
            <i className="fas fa-bolt" /> {Math.round(course.recommendationScore * 100)}% phù hợp
          </span>
        )}
      </div>
      <div className={styles.recBody}>
        <span className={styles.recCat}>{course.categoryName || course.category?.name}</span>
        <h3 className={styles.recTitle}>{course.name}</h3>
        {course.matchedTags?.length > 0 && (
          <div className={styles.recTags}>
            {course.matchedTags.slice(0, 3).map((tag, i) => (
              <span key={i} className={styles.recTag}>#{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.recMeta}>
          <span className={styles.recLevel}>{LEVEL_MAP[course.level] ?? course.level}</span>
          {course.expertName && (
            <span className={styles.recExpert}>
              <i className="fas fa-user-tie" /> {course.expertName}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function LevelBadge({ level }) {
  const map = {
    Beginner: { label: 'Mới bắt đầu', cls: styles.lvBegin },
    Intermediate: { label: 'cơ bản', cls: styles.lvInter },
    Advanced: { label: 'Nâng cao', cls: styles.lvAdv },
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
            {{ Beginner: 'Mới bắt đầu', Intermediate: 'cơ bản', Advanced: 'Nâng cao' }[course.level] ?? course.level}
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
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const PAGE_SIZE = 12;

  // Filters
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('keyword') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [level, setLevel] = useState(searchParams.get('level') || 'all');
  const [selectedTags, setSelectedTags] = useState([]); // array of tag ids

  // Recommendations
  const [recCourses, setRecCourses] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Fetch categories and tags once
  useEffect(() => {
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.data ?? []);
    }).catch(() => { });
    api.get('/tags').then(res => {
      if (res.data.success) setTags(res.data.data ?? []);
    }).catch(() => { });
  }, []);

  // Fetch recommendations for Learner
  useEffect(() => {
    if (user?.role === 'Learner') {
      setRecLoading(true);
      api.get('/courses/recommendation?limit=5')
        .then(r => {
          const list = r.data?.data ?? r.data ?? [];
          setRecCourses(Array.isArray(list) ? list : []);
        })
        .catch(() => setRecCourses([]))
        .finally(() => setRecLoading(false));
    } else {
      setRecCourses([]);
    }
  }, [user]);

  // Fetch courses whenever filters change
  const fetchCourses = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = { pageIndex: page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
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

  // Toggle a tag selection
  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
    setPageIndex(0);
  };

  // Filter by selected tags client-side
  const visibleCourses = selectedTags.length === 0
    ? courses
    : courses.filter(c =>
      c.tags?.some(t => selectedTags.includes(t.id))
    );

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
                Tất cả
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.catPill} ${categoryId === cat.id ? styles.catPillActive : ''}`}
                  onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                >
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

          {/* Recommended courses — chỉ hiện cho Learner */}
          {user?.role === 'Learner' && (recLoading || recCourses.length > 0) && (
            <div className={styles.recSection}>
              <div className={styles.recHeader}>
                <div className={styles.recTitleGroup}>
                  <h2 className={styles.recHeading}>Đề xuất dành cho bạn</h2>
                </div>
              </div>
              {recLoading ? (
                <div className={styles.recGrid}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={styles.recSkeleton} />
                  ))}
                </div>
              ) : (
                <div className={styles.recGrid}>
                  {recCourses.map(course => {
                    const courseId = course.courseId || course.id;
                    return (
                      <RecommendCard
                        key={courseId}
                        course={course}
                        onClick={id => navigate(`/courses/${id}`)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

          {/* Sub-filters: Tag multi-select */}
          {tags.length > 0 && (
            <div className={styles.tagFilterSection}>
              <div className={styles.tagFilterLabelRow}>
                <div className={styles.tagFilterLabel}>
                  <i className="fas fa-tag" /> Lọc theo tag
                </div>
                {(keyword || categoryId || level !== 'all' || selectedTags.length > 0) && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => {
                      setKeyword(''); setInputVal('');
                      setCategoryId(''); setLevel('all'); setSelectedTags([]);
                    }}
                  >
                    <i className="fas fa-times" /> Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className={styles.tagFilterPills}>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    className={`${styles.tagPill} ${selectedTags.includes(tag.id) ? styles.tagPillActive : ''}`}
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={selectedTags.includes(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <i className="fas fa-times" style={{ marginLeft: 4, fontSize: '0.6rem' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                setCategoryId(''); setLevel('all'); setSelectedTags([]);
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
          {hasMore && !loading && selectedTags.length === 0 && (
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
