import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@services/api';
import useAuth from '@state/hooks/useAuth';
import styles from './Home.module.css';
import { useOutletContext } from 'react-router-dom';

/* ── Banner slides (static) ─────────────────────────────────────────────── */
const BANNER_SLIDES = [
  { img: 'https://vndigitech.com/wp-content/uploads/2024/01/xu-huong-ung-dung-ai-vao-cac-phan-mem-nam-2024-digitech-solutions.webp', title: 'AI cho Văn phòng', desc: 'Học cách tự động hóa Excel, viết email chuyên nghiệp và tối ưu quy trình.' },
  { img: 'https://tse3.mm.bing.net/th/id/OIP.OWGxWcZb3QGVTyfvpHzP3wHaD4?rs=1&pid=ImgDetMain', title: 'AI cho Content Creator', desc: 'Viết blog, caption và kịch bản video nhanh chóng với prompt thông minh.' },
  { img: 'https://danadigital.vn/wp-content/uploads/2026/01/2-6-scaled.png', title: 'AI cho Marketing', desc: 'Thiết kế chiến dịch quảng cáo tự động và tối ưu nội dung bán hàng.' },
  { img: 'https://gaditi.com/wp-content/uploads/2026/03/ai-cho-lap-trinh-vien.jpg', title: 'AI cho Lập trình viên', desc: 'Sử dụng Copilot và LLM để tăng tốc viết code, debug và tài liệu.' },
];

const LEVEL_MAP = { Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao' };

/* ── Skeleton helpers ──────────────────────────────────────────────────── */
function CourseSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className={styles.skeletonCard}>
      <div className={styles.skeleton} style={{ aspectRatio: '16/9' }} />
      <div style={{ padding: 16 }}>
        <div className={styles.skeleton} style={{ height: 12, width: '40%', marginBottom: 10 }} />
        <div className={styles.skeleton} style={{ height: 16, marginBottom: 8 }} />
        <div className={styles.skeleton} style={{ height: 16, width: '70%' }} />
      </div>
    </div>
  ));
}

function BlogSkeleton() {
  return Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className={styles.skeletonCard}>
      <div className={styles.skeleton} style={{ aspectRatio: '16/8' }} />
      <div style={{ padding: 20 }}>
        <div className={styles.skeleton} style={{ height: 12, width: '30%', marginBottom: 10 }} />
        <div className={styles.skeleton} style={{ height: 18, marginBottom: 8 }} />
        <div className={styles.skeleton} style={{ height: 14 }} />
      </div>
    </div>
  ));
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function Home() {
  const { openLogin, openRegister, openOnboarding } = useOutletContext();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const googleLoginChecked = useRef(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash.includes('accessToken')) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    if (!accessToken) return;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const userData = {
        userId: payload.nameid || payload.sub || '',
        fullName: payload.unique_name || payload.name || '',
        email: payload.email || '',
        role: payload.role || 'Learner',
      };

      login(accessToken, userData);
      window.history.replaceState(null, '', '/');

      googleLoginChecked.current = true;

      if (userData.role === 'Learner') {
        api.get('/learner/onboarding', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(res => {
          if (res.data.success && !res.data.data?.hasCompletedOnboarding) {
            openOnboarding();
          }
        }).catch(() => { });
      }

    } catch { }
  }, []);


  // ── Data ──
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [coursesLoading, setCLoading] = useState(true);
  const [blogsLoading, setBLoading] = useState(true);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // ── Banner slider ──
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef(null);

  // Tự động chuyển slide 4s
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % BANNER_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* ── Fetch data ── */
  useEffect(() => {
    // Categories
    api.get('/categories').then(r => {
      if (r.data.success) setCategories(r.data.data ?? []);
    }).catch(() => { });

    // Top 5 courses
    api.get('/courses?pageSize=5').then(r => {
      if (r.data.success) setCourses(r.data.data?.items ?? r.data.data ?? []);
    }).catch(() => { }).finally(() => setCLoading(false));

    // Top 2 blogs
    api.get('/blogs/top?count=2').then(r => {
      const d = r.data;
      if (d.success) setBlogs(d.data ?? []);
    }).catch(() => { }).finally(() => setBLoading(false));
  }, []);

  /* ── Fetch recommendations for Learner ── */
  const fetchRecommendations = () => {
    if (user && user.role === 'Learner') {
      setRecLoading(true);
      api.get('/courses/recommendation?limit=5')
        .then(r => {
          const list = r.data?.data ?? r.data ?? [];
          setRecommendedCourses(Array.isArray(list) ? list : []);
        })
        .catch(() => setRecommendedCourses([]))
        .finally(() => setRecLoading(false));
    } else {
      setRecommendedCourses([]);
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const handleOnboardingDone = () => {
      fetchRecommendations();
    };

    window.addEventListener('onboarding-completed', handleOnboardingDone);
    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingDone);
    };
  }, [user]);

  /* ── Kiểm tra onboarding sau khi đăng nhập ── */
  useEffect(() => {
    if (!user || user.role !== 'Learner') return;
    if (googleLoginChecked.current) return;

    const checkOnboarding = async () => {
      try {
        const res = await api.get('/learner/onboarding');
        if (res.data.success && !res.data.data?.hasCompletedOnboarding) {
          openOnboarding();
        }
      } catch { }
    };
    checkOnboarding();
  }, [user]);

  /* ── Handlers ── */
  const handleCategoryClick = (categoryId) => {
    navigate(`/courses?categoryId=${categoryId}`);
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ══ HERO ══ */}
        <section className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>
              <i className="fas fa-robot" /> Đào tạo AI thiết thực
            </div>
            <h1>Học AI dễ hiểu,<br />áp dụng ngay</h1>
            <p>
              Khóa học và hướng dẫn thiết thực dành cho người mới bắt đầu đến chuyên gia,
              giúp bạn dùng AI hiệu quả trong công việc, marketing, sáng tạo và quản lý.
            </p>

            <div className={styles.heroActions}>
              {user ? (
                <Link to="/courses" className={styles.btnPrimary}>
                  <i className="fas fa-play" /> Học ngay
                </Link>
              ) : (
                <>
                  <button className={styles.btnPrimary} onClick={openRegister}>
                    <i className="fas fa-play" /> Học ngay
                  </button>
                  <button className={styles.btnSecondary} onClick={openLogin}>
                    Đăng nhập
                  </button>
                </>
              )}
            </div>


            <p className={styles.heroSubtitle}>
              Hệ thống học AI được thiết kế để bạn tiếp cận nhanh, học tập theo dự án thực tế và áp dụng ngay trong công việc.
            </p>
          </div>

          {/* Banner slider */}
          <div className={styles.heroPreview}>
            <div className={styles.heroBanner}>
              <div className={styles.bannerTitle}><h3>🔥 Chủ đề nổi bật tháng này</h3></div>
              <div ref={sliderRef}>
                {BANNER_SLIDES.map((s, i) => (
                  <div key={i} className={`${styles.bannerSlide} ${i === slide ? styles.active : ''}`}>
                    <div className={styles.bannerSlideImage}>
                      <img src={s.img} alt={s.title} />
                    </div>
                    <div className={styles.bannerSlideCopy}>
                      <h4>{s.title}</h4>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.bannerControls}>
                <button onClick={() => setSlide(s => (s - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length)}>
                  <i className="fas fa-chevron-left" />
                </button>
                <button onClick={() => setSlide(s => (s + 1) % BANNER_SLIDES.length)}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CATEGORIES ══ */}
        {categories.length > 0 && (
          <section className={styles.homeSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danh mục khóa học</h2>
            </div>
            <div className={styles.categoryList}>
              <Link to="/courses" className={styles.categoryChip}>Tất cả</Link>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={styles.categoryChip}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══ RECOMMENDED COURSES FOR YOU ══ */}
        {user && user.role === 'Learner' ? (
          (recLoading || recommendedCourses.length > 0) && (
            <section className={styles.homeSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.recommendedTitleGroup}>
                  <h2 className={styles.sectionTitle}>Khóa học đề xuất cho bạn</h2>
                </div>
                <Link to="/courses" className={styles.seeAll}>
                  Xem tất cả <i className="fas fa-arrow-right" />
                </Link>
              </div>
              <div className={styles.courseGrid}>
                {recLoading ? (
                  <CourseSkeleton />
                ) : (
                  recommendedCourses.map(course => {
                    const courseId = course.courseId || course.id;
                    return (
                      <Link to={`/courses/${courseId}`} key={courseId} className={`${styles.courseCard} ${styles.recommendedCard}`}>
                        <div className={styles.courseThumbnail}>
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.name} />
                          ) : (
                            <div className={styles.courseNoThumb}>
                              <i className="fas fa-graduation-cap" />
                            </div>
                          )}
                          {course.recommendationScore > 0 && (
                            <span className={styles.matchScoreBadge}>
                              <i className="fas fa-bolt" /> Phù hợp {Math.round(course.recommendationScore * 100)}%
                            </span>
                          )}
                        </div>
                        <div className={styles.courseBody}>
                          <div className={styles.courseCategory}>{course.categoryName || course.category?.name || 'AI Course'}</div>
                          <div className={styles.courseTitle}>{course.name}</div>
                          {course.matchedTags && course.matchedTags.length > 0 && (
                            <div className={styles.matchedTagsList}>
                              {course.matchedTags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className={styles.matchedTagChip}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className={styles.courseMeta}>
                            <span className={styles.courseLevel}>{LEVEL_MAP[course.level] ?? course.level}</span>
                            {course.expertName && (
                              <span><i className="fas fa-user-tie" style={{ marginRight: 4 }} />{course.expertName}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          )
        ) : (
          <section className={styles.homeSection}>
            <div className={styles.guestRecommendBanner}>
              <div className={styles.guestRecommendCopy}>
                <span className={styles.aiBadge}>
                  <i className="fas fa-sparkles" /> Đề xuất dành riêng cho bạn
                </span>
                <h3>Khám phá các khóa học AI phù hợp nhất với nhu cầu của bạn</h3>
                <p>Đăng nhập hoặc đăng ký tài khoản để hệ thống AI phân tích kỹ năng và đề xuất khóa học cá nhân hóa cho bạn.</p>
              </div>
              <div className={styles.guestRecommendActions}>
                <button className={styles.btnPrimary} onClick={openLogin}>
                  <i className="fas fa-sign-in-alt" /> Đăng nhập để xem đề xuất
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ══ TOP COURSES ══ */}
        <section className={styles.homeSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Khóa học mới nhất</h2>
            <Link to="/courses" className={styles.seeAll}>
              Xem tất cả <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div className={styles.courseGrid}>
            {coursesLoading
              ? <CourseSkeleton />
              : courses.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chưa có khóa học nào.</p>
                : courses.map(course => (
                  <Link to={`/courses/${course.id}`} key={course.id} className={styles.courseCard}>
                    <div className={styles.courseThumbnail}>
                      {course.thumbnailUrl
                        ? <img src={course.thumbnailUrl} alt={course.name} />
                        : <div className={styles.courseNoThumb}><i className="fas fa-graduation-cap" /></div>}
                    </div>
                    <div className={styles.courseBody}>
                      <div className={styles.courseCategory}>{course.category?.name}</div>
                      <div className={styles.courseTitle}>{course.name}</div>
                      <div className={styles.courseMeta}>
                        <span className={styles.courseLevel}>{LEVEL_MAP[course.level] ?? course.level}</span>
                        <span><i className="fas fa-clock" style={{ marginRight: 4 }} />{course.durationHours}h</span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className={styles.featureSection}>
          {[
            { icon: 'fa-project-diagram', title: 'Học theo dự án thực tế', desc: 'Mỗi khóa học đi kèm bài tập, ví dụ và bước hướng dẫn rõ ràng.' },
            { icon: 'fa-sync-alt', title: 'Nội dung cập nhật liên tục', desc: 'Luôn có bài học mới theo xu hướng AI và prompt mới nhất.' },
            { icon: 'fa-users', title: 'Hỗ trợ cộng đồng', desc: 'Thảo luận, chia sẻ mẹo và nhận phản hồi từ người học khác.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}><i className={`fas ${icon}`} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </section>

        {/* ══ TOP BLOGS ══ */}
        <section className={styles.homeSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tin tức mới</h2>
            <Link to="/blogs" className={styles.seeAll}>
              Xem tất cả <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div className={styles.blogGrid}>
            {blogsLoading
              ? <BlogSkeleton />
              : blogs.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chưa có bài viết nào.</p>
                : blogs.map(blog => (
                  <Link to={`/blogs/${blog.id}`} key={blog.id} className={styles.blogCard}>
                    {blog.thumbnailUrl && (
                      <div className={styles.blogThumbnail}>
                        <img src={blog.thumbnailUrl} alt={blog.title} />
                      </div>
                    )}
                    <div className={styles.blogBody}>
                      <div className={styles.blogMeta}>Bài viết nổi bật</div>
                      <div className={styles.blogTitle}>{blog.title}</div>
                      {/* Bỏ blogExcerpt vì TopBlogResponse không có field này */}
                      <span className={styles.blogReadMore}>
                        Xem chi tiết <i className="fas fa-arrow-right" />
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

      </div>

    </div>
  );
}
