import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ExpertCourseManagement.module.css';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=75';

const LEVEL_LABELS = {
  Beginner: 'Mới bắt đầu',
  Intermediate: 'Cơ bản',
  Advanced: 'Nâng cao',
};

export default function CourseRow({ course, onEdit, onPublish, onUnpublish, onPreview, onReReview, onLockedPublish, isPublishing }) {
  const isPublished = course.isPublished;
  const isLocked = !!course.isPublicationLocked;

  const handlePublishToggle = async () => {
    // Không cần setBusy vì isPublishing được quản lý từ parent component
    if (isPublished) await onUnpublish(course.id);
    else await onPublish(course.id);
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
          {isLocked && (
            <span className={styles.statusPill} style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
              <i className="fas fa-lock" /> Bị khoá
            </span>
          )}
          <span className={styles.levelBadge}>{LEVEL_LABELS[course.level] ?? course.level}</span>
        </div>

        <h3 className={styles.rowTitle}>{course.name}</h3>

        {course.description && (
          <p className={styles.rowDesc}>{course.description.replace(/<[^>]*>?/gm, '').trim()}</p>
        )}

        <div className={styles.rowMeta}>
          {course.category?.name && (
            <span><i className="fas fa-tag" /> {course.category.name}</span>
          )}
          <span><i className="fas fa-clock" /> {course.durationHours}h</span>
          <span><i className="fas fa-layer-group" /> {course.totalModules ?? 0} học phần</span>
          <span><i className="fas fa-book-open" /> {course.totalMaterials ?? 0} bài</span>
        </div>
      </div>

      <div className={styles.rowActions}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPreview}`}
          onClick={() => onPreview(course.id)}
          title="Xem trước như học viên"
        >
          <i className="fas fa-eye" /> Xem trước
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onEdit(course)}
          title={isPublished ? 'Hãy ẩn khóa học trước khi chỉnh sửa' : 'Chỉnh sửa thông tin'}
        >
          <i className="fas fa-pen" /> Sửa
        </button>

        <Link
          to={`/expert/courses/${course.id}/modules`}
          className={styles.actionBtn}
          title="Quản lý module & bài học"
        >
          <i className="fas fa-list-ul" /> Học phần
        </Link>

        {/* Sync RAG Button - đã được tích hợp vào nút Publish, không cần hiển thị riêng */}

        {isPublished ? (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
            onClick={handlePublishToggle}
            disabled={isPublishing}
            title="Hủy xuất bản"
          >
            {isPublishing
              ? <span className={styles.spinner} />
              : <><i className="fas fa-eye-slash" /> Ẩn</>}
          </button>
        ) : (
          <button
            className={`${styles.actionBtn} ${isLocked ? styles.actionBtnWarning : styles.actionBtnSuccess}`}
            onClick={isLocked ? () => onLockedPublish?.() : handlePublishToggle}
            disabled={isPublishing || isLocked}
            title={isLocked ? 'Khóa học đang bị khoá — nhấn để xem thông tin' : 'Xuất bản khóa học'}
          >
            {isPublishing
              ? <><span className={styles.spinner} /> Đang xuất bản...</>
              : isLocked
                ? <><i className="fas fa-lock" /> Bị khoá</>
                : <><i className="fas fa-globe" /> Xuất bản</>}
          </button>
        )}

        {/* Nút yêu cầu mở lại — chỉ khi bị khoá */}
        {isLocked && (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnReReview}`}
            onClick={() => onReReview(course)}
            title="Gửi yêu cầu xem xét lại để mở khoá"
          >
            <i className="fas fa-file-signature" /> Yêu cầu mở lại
          </button>
        )}
      </div>
    </div>
  );
}
