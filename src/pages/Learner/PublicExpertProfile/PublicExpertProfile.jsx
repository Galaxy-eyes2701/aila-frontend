import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './PublicExpertProfile.module.css';

import { DEFAULT_AVATAR } from '../../../constants/defaultAvatar';
const FALLBACK_THUMB  = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

function ExpertCourseCard({ course, onClick }) {
  return (
    <article
      className={styles.ccard}
      onClick={() => onClick(course.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(course.id)}
      aria-label={course.name}
    >
      <div className={styles.ccardThumb}>
        <img
          src={course.thumbnailUrl || FALLBACK_THUMB}
          alt={course.name}
          onError={e => { e.target.src = FALLBACK_THUMB; }}
          loading="lazy"
        />
        <span className={styles.ccardDur}>{course.durationHours}h</span>
      </div>
      <div className={styles.ccardBody}>
        <h3 className={styles.ccardTitle}>{course.name}</h3>
        {course.description && (
          <p className={styles.ccardDesc}>{course.description}</p>
        )}
        <div className={styles.ccardFoot}>
          <span className={styles.lvBadge}>{LEVEL_LABELS[course.level] ?? course.level}</span>
        </div>
      </div>
    </article>
  );
}

export default function PublicExpertProfile() {
  const { expertId } = useParams();
  const navigate = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError('');
    api.get(`/public/experts/${expertId}/profile`)
      .then(res => {
        if (res.data.success) setProfile(res.data.data);
        else setNotFound(true);
      })
      .catch(err => {
        // 404 (EXPERT_NOT_FOUND) và 400 (guid sai định dạng, không có ResponseDto envelope)
        // đều coi là "không tìm thấy" từ góc nhìn UI.
        if (err.response?.status === 404 || err.response?.status === 400) {
          setNotFound(true);
        } else {
          setError('Không tải được hồ sơ chuyên gia. Vui lòng thử lại.');
        }
      })
      .finally(() => setLoading(false));
  }, [expertId]);

  useEffect(() => {
    if (!profile) return;
    const prevTitle = document.title;
    document.title = `${profile.fullName} — AILA`;
    return () => { document.title = prevTitle; };
  }, [profile]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Đang tải hồ sơ chuyên gia...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.errorPage}>
        <i className="fas fa-user-slash" />
        <h2>Không tìm thấy hồ sơ chuyên gia này.</h2>
        <button className={styles.backBtn} onClick={() => navigate('/courses')}>
          <i className="fas fa-arrow-left" /> Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.errorPage}>
        <i className="fas fa-exclamation-triangle" />
        <h2>{error || 'Không tải được hồ sơ chuyên gia. Vui lòng thử lại.'}</h2>
        <button className={styles.backBtn} onClick={() => navigate(0)}>
          <i className="fas fa-rotate-right" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <img
            src={profile.avatarUrl || DEFAULT_AVATAR}
            alt={profile.fullName}
            className={styles.avatar}
            onError={e => { e.target.src = DEFAULT_AVATAR; }}
          />
          <div className={styles.heroInfo}>
            <h1 className={styles.name}>{profile.fullName}</h1>
            {profile.specialty && (
              <p className={styles.specialty}>{profile.specialty}</p>
            )}
            {profile.yearsOfExperience > 0 && (
              <span className={styles.expBadge}>
                <i className="fas fa-briefcase" />
                <strong>{profile.yearsOfExperience}</strong> năm kinh nghiệm
              </span>
            )}
            {profile.bio && (
              <p className={styles.bio}>{profile.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── COURSES ───────────────────────────────────────── */}
      <div className={styles.body}>
        <h2 className={styles.sectionTitle}>
          Khóa học đã xuất bản ({profile.totalPublishedCourses})
        </h2>

        {profile.courses.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-book-open" />
            <p>Chuyên gia này chưa xuất bản khóa học nào.</p>
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {profile.courses.map(course => (
              <ExpertCourseCard
                key={course.id}
                course={course}
                onClick={id => navigate(`/courses/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
