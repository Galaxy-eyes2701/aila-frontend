import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import api from '../../utils/api';
import styles from './CoursePreviewModal.module.css';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=75';
const DEFAULT_AVATAR = 'https://i.pravatar.cc/80';

const LEVEL_LABELS = {
  Beginner:     'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced:     'Nâng cao',
};

/* ── helpers ──────────────────────────────────────────────────────────────── */
function getMaterialIcon(type = '') {
  const t = type.toLowerCase();
  if (t.includes('video'))    return 'fa-play-circle';
  if (t.includes('document')) return 'fa-file-alt';
  if (t.includes('quiz'))     return 'fa-vial';
  return 'fa-file-alt';
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let m = url.match(/youtu\.be\/([^?&]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/[?&]v=([^&]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  if (url.includes('/embed/')) return url;
  return null;
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function PreviewSidebar({ modules, currentMaterialId, onSelect }) {
  const sorted = [...modules].sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <i className="fas fa-list-ul" /> Nội dung khóa học
      </div>
      <div className={styles.sidebarScroll}>
        {sorted.map(mod => {
          const mats = [...(mod.materials ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
          return (
            <div key={mod.id} className={styles.sidebarModule}>
              <div className={styles.sidebarModuleTitle}>
                Chương {mod.orderIndex}: {mod.title}
              </div>
              <ul className={styles.sidebarMaterialList}>
                {mats.map(m => (
                  <li
                    key={m.id}
                    className={`${styles.sidebarMaterial} ${currentMaterialId === m.id ? styles.sidebarMaterialActive : ''}`}
                    onClick={() => onSelect(m.id)}
                  >
                    <i className={`fas ${getMaterialIcon(m.materialType ?? m.type)} ${styles.matIcon}`} />
                    <span>Bài {m.orderIndex}: {m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Content Panel ────────────────────────────────────────────────────────── */
function PreviewContent({ material, loading }) {
  if (loading) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.contentSpinner}>
          <span className={styles.spinner} /> Đang tải nội dung bài học...
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.contentEmpty}>
          <i className="fas fa-hand-pointer" />
          <p>Chọn một bài học từ danh sách bên phải để xem trước nội dung.</p>
        </div>
      </div>
    );
  }

  const type = (material.type ?? material.materialType ?? '').toLowerCase();
  const videoUrl = material.videoDetails?.videoUrl ?? '';
  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  return (
    <div className={styles.contentArea}>
      <div className={styles.previewBadge}>
        <i className="fas fa-eye" /> CHẾ ĐỘ XEM TRƯỚC — không ghi nhận tiến độ
      </div>

      <h2 className={styles.materialTitle}>{material.title}</h2>

      {/* VIDEO */}
      {type.includes('video') && material.videoDetails && (
        <div className={styles.videoSection}>
          <div className={styles.videoHolder}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={material.title}
                className={styles.videoPlayer}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoUrl} controls className={styles.videoPlayer} />
            )}
          </div>
          {material.videoDetails.content && (
            <div className={styles.richSection}>
              <h3 className={styles.richTitle}><i className="fas fa-list-alt" /> Nội dung & Tài nguyên</h3>
              <div
                className={styles.richBody}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(material.videoDetails.content) }}
              />
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT */}
      {type.includes('document') && material.documentDetails && (
        <div className={styles.documentSection}>
          {material.documentDetails.content ? (
            <div
              className={styles.richBody}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(material.documentDetails.content) }}
            />
          ) : (
            <p className={styles.noContent}>Không có nội dung văn bản cho bài học này.</p>
          )}
          {material.documentDetails.documentUrl && (
            <a
              href={material.documentDetails.documentUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.downloadBtn}
            >
              <i className="fas fa-download" /> Tải tài liệu đi kèm
            </a>
          )}
        </div>
      )}

      {/* QUIZ */}
      {type.includes('quiz') && (
        <div className={styles.quizPreview}>
          <i className="fas fa-vial" />
          <p>Bài kiểm tra — Chỉ xem được khi học viên đăng ký khóa học.</p>
          <span className={styles.quizNote}>
            <i className="fas fa-info-circle" /> Preview mode không hiển thị câu hỏi để bảo mật nội dung.
          </span>
        </div>
      )}

      {/* UNSUPPORTED */}
      {!type.includes('video') && !type.includes('document') && !type.includes('quiz') && (
        <div className={styles.noContent}>Định dạng chưa được hỗ trợ xem trước.</div>
      )}
    </div>
  );
}

/* ── Overview Panel (trang chủ khoá học) ─────────────────────────────────── */
function PreviewOverview({ course }) {
  const totalMaterials = course.modules?.reduce((s, m) => s + (m.materials?.length ?? 0), 0) ?? 0;

  return (
    <div className={styles.contentArea}>
      {/* Hero */}
      <section className={styles.overviewHero}>
        <div className={styles.overviewHeroThumb}>
          <img
            src={course.thumbnailUrl || FALLBACK_THUMB}
            alt={course.name}
            onError={e => { e.target.src = FALLBACK_THUMB; }}
          />
        </div>
        <div className={styles.overviewHeroInfo}>
          <span className={styles.overviewCategory}>{course.category?.name}</span>
          <h2 className={styles.overviewTitle}>{course.name}</h2>
          {course.description && <p className={styles.overviewDesc}>{course.description}</p>}
          <div className={styles.overviewMeta}>
            <span><i className="fas fa-layer-group" /> {LEVEL_LABELS[course.level] ?? course.level}</span>
            <span><i className="fas fa-clock" /> {course.durationHours}h</span>
            <span><i className="fas fa-book-open" /> {course.totalModules} module · {totalMaterials} bài</span>
          </div>
          <div className={`${styles.statusBadge} ${course.isPublished ? styles.statusPublished : styles.statusDraft}`}>
            <i className={`fas ${course.isPublished ? 'fa-globe' : 'fa-pencil-alt'}`} />
            {course.isPublished ? 'Đã xuất bản' : 'Bản nháp — chưa hiển thị với học viên'}
          </div>
        </div>
      </section>

      {/* Tags */}
      {course.tags?.length > 0 && (
        <section className={styles.overviewSection}>
          <h3 className={styles.overviewSectionTitle}>Kỹ năng đạt được</h3>
          <div className={styles.skillTags}>
            {course.tags.map(t => <span key={t.id} className={styles.skillTag}>{t.name}</span>)}
          </div>
        </section>
      )}

      {/* Instructor */}
      <section className={styles.overviewSection}>
        <h3 className={styles.overviewSectionTitle}>Giảng viên</h3>
        <div className={styles.instructorRow}>
          <img
            src={course.author?.avatarUrl || DEFAULT_AVATAR}
            alt={course.author?.fullName}
            className={styles.instructorAvatar}
            onError={e => { e.target.src = DEFAULT_AVATAR; }}
          />
          <div>
            <div className={styles.instructorName}>{course.author?.fullName}</div>
            {course.author?.specialty && <div className={styles.instructorSub}>{course.author.specialty}</div>}
            {course.author?.bio && <p className={styles.instructorBio}>{course.author.bio}</p>}
          </div>
        </div>
      </section>

      <div className={styles.overviewHint}>
        <i className="fas fa-arrow-right" /> Chọn một bài học từ danh sách bên phải để xem trước nội dung.
      </div>
    </div>
  );
}

/* ── Main Modal ────────────────────────────────────────────────────────────── */
export default function CoursePreviewModal({ courseId, onClose }) {
  const [course,          setCourse]          = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [contentLoading,  setContentLoading]  = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/courses/${courseId}`);
      if (res.data.success) setCourse(res.data.data);
      else setError('Không tải được khóa học.');
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSelectMaterial = async materialId => {
    if (currentMaterial?.id === materialId) return;
    setContentLoading(true);
    setCurrentMaterial(null);
    try {
      const res = await api.get(`/experts/me/courses/${courseId}/materials/${materialId}/preview`);
      if (res.data.success) setCurrentMaterial(res.data.data);
    } catch { /* silent */ } finally {
      setContentLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true">

        {/* ── BANNER ─────────────────────────────────────────────── */}
        <div className={styles.previewBanner}>
          <i className="fas fa-eye" />
          CHẾ ĐỘ XEM TRƯỚC — Mô phỏng giao diện học viên. Không tạo enrollment, tiến độ hay kết quả quiz.
          <button className={styles.closeBannerBtn} onClick={onClose} aria-label="Đóng xem trước">
            <i className="fas fa-times" /> Đóng xem trước
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        {loading && (
          <div className={styles.centerState}>
            <span className={styles.spinner} />
            <p>Đang tải khóa học...</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.centerState}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: 36, color: '#ef4444' }} />
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={fetchCourse}>
              <i className="fas fa-rotate-right" /> Thử lại
            </button>
          </div>
        )}

        {!loading && !error && course && (
          <div className={styles.learningLayout}>
            {/* Left: content */}
            {currentMaterial || contentLoading
              ? <PreviewContent material={currentMaterial} loading={contentLoading} />
              : <PreviewOverview course={course} />
            }
            {/* Right: sidebar */}
            <PreviewSidebar
              modules={course.modules ?? []}
              currentMaterialId={currentMaterial?.id}
              onSelect={handleSelectMaterial}
            />
          </div>
        )}
      </div>
    </div>
  );
}
